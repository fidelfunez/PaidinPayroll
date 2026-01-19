import { Express } from "express";
import jwt from "jsonwebtoken";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, users } from "@shared/schema";
import { sendVerificationEmail, sendAdminNotificationEmail } from "./utils/email-service";
import { db } from "./db";
import { companies } from "@shared/schema";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface User extends SelectUser {
      company?: {
        id: number;
        name: string;
        slug: string;
        primaryColor: string;
      } | null;
    }
  }
}

const scryptAsync = promisify(scrypt);
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET or SESSION_SECRET environment variable is required');
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateToken(user: SelectUser): string {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error: any) {
    console.error('JWT verification error:', error.message);
    return null;
  }
}

// Generate email verification token
function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

// Generate company slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}

export function setupAuth(app: Express) {
  // JWT middleware to extract user from token
  app.use(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        try {
          const user = await storage.getUser(decoded.id);
          if (user && user.isActive) {
            // Get user's company
            const company = user.companyId ? await storage.getCompany(user.companyId) : null;
            if (company) {
              req.user = {
                ...user,
                companyId: user.companyId, // Ensure companyId is explicitly set
                company: {
                  id: company.id,
                  name: company.name,
                  slug: company.slug,
                  primaryColor: company.primaryColor || '#f97316',
                }
              };
            } else if (user.companyId) {
              console.warn(`[JWT Middleware] User ${user.id} is active but company ${user.companyId} not found`);
              // Still set req.user but without company object
              req.user = {
                ...user,
                companyId: user.companyId,
                company: null
              };
            } else {
              console.warn(`[JWT Middleware] User ${user.id} is active but has no companyId`);
              // Set req.user but companyId will be undefined
              req.user = {
                ...user,
                company: null
              };
            }
          } else {
            if (!user) {
              console.warn(`[JWT Middleware] User ${decoded.id} not found in database`);
            } else if (!user.isActive) {
              console.warn(`[JWT Middleware] User ${user.id} is not active`);
            }
          }
        } catch (error) {
          console.error('[JWT Middleware] Error fetching user from token:', error);
        }
      } else {
        if (!decoded) {
          console.warn('[JWT Middleware] Token verification failed');
        } else if (!decoded.id) {
          console.warn('[JWT Middleware] Token decoded but missing user id');
        }
      }
    } else {
      // Only log missing auth header for protected routes to reduce noise
      if (req.path.startsWith('/api/') && !req.path.includes('/signup') && !req.path.includes('/login') && !req.path.includes('/verify-email')) {
        console.log(`[JWT Middleware] No Authorization header for ${req.method} ${req.path}`);
      }
    }
    next();
  });

  // New signup endpoint: Creates company + admin user with email verification
  app.post("/api/signup", async (req, res) => {
    try {
      const { 
        firstName, 
        lastName, 
        email, 
        username, 
        password, 
        companyName,
        plan = 'free' // 'free', 'starter', 'growth', 'scale'
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !username || !password || !companyName) {
        return res.status(400).json({ 
          message: "All fields are required: firstName, lastName, email, username, password, companyName" 
        });
      }

      // Check if username exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ 
          message: "This username is already taken. Please try a different username." 
        });
      }

      // Check if email exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ 
          message: "This email is already registered. Please use a different email or log in." 
        });
      }

      // Generate company slug and ensure uniqueness
      let baseSlug = generateSlug(companyName);
      let companySlug = baseSlug;
      let counter = 1;
      
      // Check for slug conflicts
      while (true) {
        const existingCompany = await db.select()
          .from(companies)
          .where(eq(companies.slug, companySlug))
          .limit(1);
        
        if (existingCompany.length === 0) break;
        companySlug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Determine subscription details based on plan
      const planConfig = {
        free: { maxEmployees: 3, monthlyFee: 0, subscriptionStatus: 'active' },
        starter: { maxEmployees: 10, monthlyFee: 149.99, subscriptionStatus: 'trial' },
        growth: { maxEmployees: 50, monthlyFee: 499.99, subscriptionStatus: 'trial' },
        scale: { maxEmployees: 100, monthlyFee: 999.99, subscriptionStatus: 'trial' },
      };

      const selectedPlan = planConfig[plan as keyof typeof planConfig] || planConfig.free;

      // Create company - pass createdAt/updatedAt as Date objects (even though omitted from insertCompanySchema, we pass them with 'as any')
      const companyData: any = {
        name: companyName,
        slug: companySlug,
        isActive: true,
        subscriptionPlan: plan,
        subscriptionStatus: selectedPlan.subscriptionStatus,
        maxEmployees: selectedPlan.maxEmployees,
        monthlyFee: selectedPlan.monthlyFee,
        createdAt: new Date(), // Pass Date object explicitly to avoid default number/Date mismatch
        updatedAt: new Date(), // Pass Date object explicitly
      };

      // Only add trial dates if not free plan
      if (plan !== 'free') {
        const now = new Date();
        const trialEnd = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));
        companyData.trialStartDate = now;
        companyData.trialEndDate = trialEnd;
      }

      const company = await storage.createCompany(companyData);

      // Note: Stripe customer creation removed for accounting-focused MVP
      // Can be re-added later if billing integration is needed

      // Generate verification token
      const verificationToken = generateVerificationToken();
      const tokenExpiryTimestamp = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      const tokenExpiry = new Date(tokenExpiryTimestamp);

      // Verify tokenExpiry is a valid Date
      if (!(tokenExpiry instanceof Date) || isNaN(tokenExpiry.getTime())) {
        throw new Error('Failed to create valid token expiry date');
      }

      // Create admin user (not verified yet)
      const userData: any = {
        firstName,
        lastName,
        email,
        username,
        password: await hashPassword(password),
        companyId: company.id,
        role: 'admin' as const, // Only admins can sign up
        isActive: true,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiry: tokenExpiry,
        monthlySalary: null,
        createdAt: new Date(), // Pass Date object explicitly to avoid default number/Date mismatch
      };

      const user = await storage.createUser(userData);

      // Construct verification URL
      const appUrl = process.env.APP_URL || (process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5173' 
        : 'https://app.paidin.io');
      const verificationUrl = `${appUrl}/verify-email/${verificationToken}`;
      
      try {
        await sendVerificationEmail({
          email: user.email,
          firstName: user.firstName,
          verificationToken,
          verificationUrl,
        });
      } catch (emailError: any) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails - user can request resend
      }

      // Send admin notification email
      if (process.env.ADMIN_EMAIL) {
        try {
          await sendAdminNotificationEmail({
            to: process.env.ADMIN_EMAIL,
            newUser: {
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              companyName: company.name,
              signupDate: new Date(),
              plan: plan,
            },
          });
        } catch (adminEmailError: any) {
          console.error('Failed to send admin notification email:', adminEmailError);
          // Don't fail registration if admin notification fails
        }
      }

      // Return success (user not logged in until email verified)
      res.status(201).json({ 
        message: "Account created! Please check your email to verify your account.",
        email: user.email,
        requiresVerification: true,
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      console.error('Signup error stack:', error.stack);
      // Handle unique constraint violations
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        if (error.message?.includes('email')) {
          return res.status(400).json({ 
            message: "This email is already registered. Please use a different email or log in." 
          });
        }
        if (error.message?.includes('username')) {
          return res.status(400).json({ 
            message: "This username is already taken. Please try a different username." 
          });
        }
        if (error.message?.includes('slug')) {
          return res.status(400).json({ 
            message: "A company with this name already exists. Please try a different name." 
          });
        }
      }
      res.status(500).json({ 
        message: "Unable to create account. Please try again or contact support.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Legacy register endpoint (for backward compatibility - creates user in existing company)
  app.post("/api/register", async (req, res) => {
    try {
      // Check if username exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ 
          message: "This username is already taken. Please try a different username." 
        });
      }

      // Check if email exists
      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ 
          message: "This email is already registered. Please use a different email or log in." 
        });
      }

      // Get or create default company
      let companies = await storage.getCompanies();
      let company;
      if (!companies || companies.length === 0) {
        company = await storage.createCompany({
          name: 'PaidIn',
          slug: 'paidin',
          domain: null,
          primaryColor: '#f97316',
          isActive: true,
        });
      } else {
        company = companies[0];
      }

      // Transform numeric fields to handle empty strings
      const userData = {
        ...req.body,
        companyId: company.id,
        password: await hashPassword(req.body.password),
        monthlySalary: req.body.monthlySalary === "" ? null : (req.body.monthlySalary ? parseFloat(req.body.monthlySalary) : null),
        role: req.body.role || 'employee',
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        emailVerified: true, // Legacy users are auto-verified
        createdAt: new Date(),
      };

      const user = await storage.createUser(userData);
      const token = generateToken(user);
      const userCompany = await storage.getCompany(user.companyId);
      
      res.status(201).json({ 
        user: {
          ...user,
          company: userCompany ? {
            id: userCompany.id,
            name: userCompany.name,
            slug: userCompany.slug,
            primaryColor: userCompany.primaryColor,
          } : null
        }, 
        token 
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      // Handle unique constraint violations
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        if (error.message?.includes('email')) {
          return res.status(400).json({ 
            message: "This email is already registered. Please use a different email or log in." 
          });
        }
        if (error.message?.includes('username')) {
          return res.status(400).json({ 
            message: "This username is already taken. Please try a different username." 
          });
        }
      }
      res.status(500).json({ 
        message: "Unable to create account. Please try again or contact support." 
      });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          message: "Username and password are required." 
        });
      }
      
      // Get user by username or email (case-insensitive lookup handled in storage layer)
      let user = await storage.getUserByUsernameOrEmail(username);
      if (!user) {
        return res.status(401).json({ 
          message: "Username/email or password is incorrect. Please check your credentials and try again." 
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ 
          message: "Your account has been deactivated. Please contact your administrator." 
        });
      }

      // Verify password
      const passwordValid = await comparePasswords(password, user.password);
      if (!passwordValid) {
        return res.status(401).json({ 
          message: "Username/email or password is incorrect. Please check your credentials and try again." 
        });
      }

      // Check if email is verified (only for new signups)
      if (!user.emailVerified) {
        return res.status(403).json({ 
          message: "Please verify your email address before logging in. Check your inbox for the verification link.",
          requiresVerification: true,
          email: user.email,
        });
      }

      // Get user's company (handle null/undefined companyId)
      let company = null;
      
      // Check if user has a valid companyId
      if (user.companyId && typeof user.companyId === 'number') {
        try {
          company = await storage.getCompany(user.companyId);
          if (!company) {
            console.log(`User ${user.id} has companyId ${user.companyId} but company doesn't exist`);
          }
        } catch (error: any) {
          console.error('Error fetching company:', error);
          console.error('Company ID:', user.companyId);
          console.error('Error details:', error.message, error.stack);
        }
      } else {
        console.log(`User ${user.id} has invalid or missing companyId:`, user.companyId);
      }
      
      // If no company found, create/assign default company
      if (!company) {
        try {
          console.log('Creating or finding default company for user', user.id);
          let companies = await storage.getCompanies();
          let defaultCompany = companies && companies.length > 0 ? companies[0] : null;
          
          if (!defaultCompany) {
            console.log('Creating new default PaidIn company');
            defaultCompany = await storage.createCompany({
              name: 'PaidIn',
              slug: 'paidin',
              domain: null,
              primaryColor: '#f97316',
              isActive: true,
            });
            console.log('Created company with ID:', defaultCompany.id);
          } else {
            console.log('Found existing company with ID:', defaultCompany.id);
          }
          
          // Update user with company (only if they don't have one or it's invalid)
          if (!user.companyId || user.companyId !== defaultCompany.id) {
            console.log(`Updating user ${user.id} with companyId ${defaultCompany.id}`);
            const updatedUser = await storage.updateUser(user.id, { companyId: defaultCompany.id });
            if (updatedUser) {
              // Refresh user object from database to ensure we have all fields including profilePhoto
              const refreshedUser = await storage.getUser(user.id);
              if (refreshedUser) {
                user = refreshedUser;
              }
              console.log('User updated successfully');
            } else {
              console.error('Failed to update user');
            }
          }
          
          company = defaultCompany;
        } catch (error: any) {
          console.error('Error creating/assigning company:', error);
          console.error('Error stack:', error.stack);
          console.error('Error message:', error.message);
          console.error('Error code:', error.code);
          return res.status(500).json({ 
            message: "An error occurred during login. Please try again.",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
          });
        }
      }

      // Generate token with company context
      const token = generateToken(user);

      res.status(200).json({ 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          bio: user.bio,
          profilePhoto: user.profilePhoto,
          monthlySalary: user.monthlySalary,
          withdrawalMethod: user.withdrawalMethod,
          btcAddress: user.btcAddress,
          createdAt: user.createdAt,
          companyId: user.companyId,
          company: company ? {
            id: company.id,
            name: company.name,
            slug: company.slug,
            primaryColor: company.primaryColor || '#f97316',
          } : null
        }, 
        token 
      });
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      res.status(500).json({ 
        message: "An error occurred during login. Please try again.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/logout", (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    res.sendStatus(200);
  });

  // Email verification endpoint
  app.get("/api/verify-email/:token", async (req, res) => {
    try {
      const { token } = req.params;

      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      // Find user by verification token
      const [user] = await db.select()
        .from(users)
        .where(eq(users.emailVerificationToken, token));

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Check if token is expired
      if (user.emailVerificationTokenExpiry && new Date(user.emailVerificationTokenExpiry) < new Date()) {
        return res.status(400).json({ message: "Verification token has expired. Please request a new one." });
      }

      // Check if already verified
      if (user.emailVerified) {
        return res.status(200).json({ 
          message: "Email already verified. You can now log in.",
          verified: true 
        });
      }

      // Verify the email
      await storage.updateUser(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      });

      // Generate token and log them in
      const verifiedUser = await storage.getUser(user.id);
      if (!verifiedUser) {
        return res.status(500).json({ message: "Error verifying email" });
      }

      const authToken = generateToken(verifiedUser);
      const company = await storage.getCompany(verifiedUser.companyId);

      res.status(200).json({ 
        message: "Email verified successfully!",
        verified: true,
        user: {
          ...verifiedUser,
          company: company ? {
            id: company.id,
            name: company.name,
            slug: company.slug,
            primaryColor: company.primaryColor,
          } : null
        },
        token: authToken,
      });
    } catch (error: any) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: "Error verifying email. Please try again." });
    }
  });

  // Resend verification email endpoint
  app.post("/api/resend-verification", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);

      if (!user) {
        // Don't reveal if email exists for security
        return res.status(200).json({ 
          message: "If an account exists with this email, a verification link has been sent." 
        });
      }

      if (user.emailVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Generate new verification token
      const verificationToken = generateVerificationToken();
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await storage.updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiry: tokenExpiry,
      });

      // Send verification email
      const appUrl = process.env.APP_URL || (process.env.NODE_ENV === 'development' 
        ? 'http://localhost:5173' 
        : 'https://app.paidin.io');
      const verificationUrl = `${appUrl}/verify-email/${verificationToken}`;
      
      try {
        await sendVerificationEmail({
          email: user.email,
          firstName: user.firstName,
          verificationToken,
          verificationUrl,
        });
      } catch (emailError: any) {
        console.error('Failed to send verification email:', emailError);
        return res.status(500).json({ message: "Failed to send verification email. Please try again." });
      }

      res.status(200).json({ 
        message: "Verification email sent! Please check your inbox." 
      });
    } catch (error: any) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: "Error sending verification email. Please try again." });
    }
  });

  // Debug endpoint to check user status (remove in production)
  app.get("/api/debug/user-status", async (req, res) => {
    try {
      const user = await storage.getUserByUsername('fidel');
      const companies = await storage.getCompanies();
      res.json({
        userExists: !!user,
        user: user ? {
          id: user.id,
          username: user.username,
          companyId: user.companyId,
          isActive: user.isActive,
        } : null,
        companies: companies.map(c => ({ id: c.id, name: c.name })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  });

  app.get("/api/user", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      // Refresh user data from database to ensure it's up to date
      const user = await storage.getUser(req.user.id);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "User not found or inactive" });
      }
      
      const company = await storage.getCompany(user.companyId);
      if (!company) {
        return res.status(401).json({ message: "Company not found" });
      }
      
      res.json({
        ...user,
        company: {
          id: company.id,
          name: company.name,
          slug: company.slug,
          primaryColor: company.primaryColor || '#f97316',
          subscriptionPlan: company.subscriptionPlan,
          subscriptionStatus: company.subscriptionStatus,
          trialStartDate: company.trialStartDate,
          trialEndDate: company.trialEndDate,
          maxEmployees: company.maxEmployees,
          monthlyFee: company.monthlyFee,
        }
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: "Error fetching user data" });
    }
  });

  // Update user profile
  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const { firstName, lastName, email, profilePhoto, bio } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ 
          error: "Missing required fields: firstName, lastName, email" 
        });
      }

      // Check if email is being changed and if it's already taken
      if (email !== user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== user.id) {
          return res.status(400).json({ 
            error: "Email address is already in use" 
          });
        }
      }

      // Update user
      const updatedUser = await storage.updateUser(user.id, {
        firstName,
        lastName,
        email,
        profilePhoto: profilePhoto || null,
        // Note: bio field doesn't exist in schema, so we'll skip it for now
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Change password
  app.patch("/api/user/password", requireAuth, async (req, res) => {
    try {
      const user = req.user!;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          error: "Both current password and new password are required" 
        });
      }

      // Validate new password strength
      if (newPassword.length < 8) {
        return res.status(400).json({ 
          error: "New password must be at least 8 characters long" 
        });
      }

      // Verify current password
      const passwordValid = await comparePasswords(currentPassword, user.password);
      if (!passwordValid) {
        return res.status(401).json({ 
          error: "Current password is incorrect" 
        });
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      const updatedUser = await storage.updateUser(user.id, {
        password: hashedPassword,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error: any) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // Get company by email domain (for email-based routing)
  app.post("/api/company-by-email", async (req, res) => {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        message: "Please enter a valid email address (e.g., john@company.com)" 
      });
    }

    // Extract domain from email
    const domain = email.split('@')[1];
    
    // Get company by domain
    const company = await storage.getCompanyByDomain(domain);
    
    if (!company) {
      return res.status(404).json({ 
        message: "We couldn't find a company associated with this email domain. Please check your email address or contact your administrator.",
        domain: domain 
      });
    }

    res.json({
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        primaryColor: company.primaryColor || '#f97316',
      }
    });
  });
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Please log in to access this page.' 
    });
  }
  next();
}

// Middleware to require admin role
export function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'platform_admin')) {
    return res.status(403).json({ 
      message: 'You need administrator privileges to access this page. Please contact your administrator.' 
    });
  }
  next();
}

// Middleware to require super admin role (for Bitcoin operations)
export function requireSuperAdmin(req: any, res: any, next: any) {
  if (!req.user || (req.user.role !== 'super_admin' && req.user.role !== 'platform_admin')) {
    return res.status(403).json({ 
      message: 'You need super administrator privileges to access this page. Only super administrators can perform Bitcoin operations.' 
    });
  }
  next();
}

// Middleware to require platform admin role
export function requirePlatformAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== 'platform_admin') {
    return res.status(403).json({ 
      message: 'You need platform administrator privileges to access this page.' 
    });
  }
  next();
}
