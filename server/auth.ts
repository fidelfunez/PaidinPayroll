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
  } catch (error) {
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
      if (decoded) {
        const user = await storage.getUser(decoded.id);
        if (user) {
          // Get user's company
          const company = await storage.getCompany(user.companyId);
          req.user = {
            ...user,
            company: company ? {
              id: company.id,
              name: company.name,
              slug: company.slug,
              primaryColor: company.primaryColor || '#f97316',
            } : null
          };
        }
      }
    }
    next();
  });

  app.post("/api/register", async (req, res) => {
    // Normalize username to lowercase for consistency
    const normalizedUsername = req.body.username.toLowerCase();
    
    const existingUser = await storage.getUserByUsername(normalizedUsername);
    if (existingUser) {
      return res.status(400).json({ 
        message: "This username is already taken. Please try a different username." 
      });
    }

    // Transform numeric fields to handle empty strings
    const userData = {
      ...req.body,
      username: normalizedUsername, // Store username in lowercase
      password: await hashPassword(req.body.password),
      monthlySalary: req.body.monthlySalary === "" ? null : req.body.monthlySalary,
      createdAt: new Date(),
    };

    try {
      const user = await storage.createUser(userData);
      const token = generateToken(user);
      res.status(201).json({ user, token });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: "Unable to create account. Please try again or contact support." 
      });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    
    // Normalize username to lowercase for case-insensitive login
    const normalizedUsername = username.toLowerCase();
    
    // Get user by username (now case-insensitive)
    const user = await storage.getUserByUsername(normalizedUsername);
    if (!user || !(await comparePasswords(password, user.password))) {
      return res.status(401).json({ 
        message: "Username or password is incorrect. Please check your credentials and try again." 
      });
    }

    // Get user's company
    const company = await storage.getCompany(user.companyId);
    if (!company) {
      return res.status(401).json({ 
        message: "Your account is not associated with a company. Please contact your administrator." 
      });
    }

    // Generate token with company context
    const token = generateToken({ ...user, companyId: user.companyId });

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
          primaryColor: company.primaryColor,
        }
      }, 
      token 
    });
  });

  app.post("/api/logout", (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    res.sendStatus(200);
  });

  app.get("/api/user", (req, res) => {
    if (!req.user) return res.sendStatus(401);
    res.json(req.user);
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
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'You need administrator privileges to access this page. Please contact your administrator.' 
    });
  }
  next();
}
