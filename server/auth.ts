import { Express } from "express";
import jwt from "jsonwebtoken";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

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
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'fallback-secret';

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
            const company = await storage.getCompany(user.companyId);
            if (company) {
              req.user = {
                ...user,
                company: {
                  id: company.id,
                  name: company.name,
                  slug: company.slug,
                  primaryColor: company.primaryColor || '#f97316',
                }
              };
            }
          }
        } catch (error) {
          console.error('Error fetching user from token:', error);
        }
      }
    }
    next();
  });

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
      const user = await storage.getUserByUsernameOrEmail(username);
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

      // Get user's company
      const company = await storage.getCompany(user.companyId);
      if (!company) {
        // If no company, create default company and associate user
        let defaultCompany = (await storage.getCompanies())[0];
        if (!defaultCompany) {
          defaultCompany = await storage.createCompany({
            name: 'PaidIn',
            slug: 'paidin',
            domain: null,
            primaryColor: '#f97316',
            isActive: true,
          });
        }
        // Update user with company
        await storage.updateUser(user.id, { companyId: defaultCompany.id });
        user.companyId = defaultCompany.id;
        
        // Generate token
        const token = generateToken(user);
        
        return res.status(200).json({ 
          user: { 
            id: user.id, 
            username: user.username, 
            role: user.role,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            monthlySalary: user.monthlySalary,
            withdrawalMethod: user.withdrawalMethod,
            btcAddress: user.btcAddress,
            createdAt: user.createdAt,
            companyId: user.companyId,
            company: {
              id: defaultCompany.id,
              name: defaultCompany.name,
              slug: defaultCompany.slug,
              primaryColor: defaultCompany.primaryColor || '#f97316',
            }
          }, 
          token 
        });
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
          monthlySalary: user.monthlySalary,
          withdrawalMethod: user.withdrawalMethod,
          btcAddress: user.btcAddress,
          createdAt: user.createdAt,
          companyId: user.companyId,
          company: {
            id: company.id,
            name: company.name,
            slug: company.slug,
            primaryColor: company.primaryColor || '#f97316',
          }
        }, 
        token 
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ 
        message: "An error occurred during login. Please try again." 
      });
    }
  });

  app.post("/api/logout", (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    res.sendStatus(200);
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
        }
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: "Error fetching user data" });
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
