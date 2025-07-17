import { Express } from "express";
import jwt from "jsonwebtoken";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
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
          req.user = user;
        }
      }
    }
    next();
  });

  app.post("/api/register", async (req, res) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Transform numeric fields to handle empty strings
    const userData = {
      ...req.body,
      password: await hashPassword(req.body.password),
      monthlySalary: req.body.monthlySalary === "" ? null : req.body.monthlySalary,
      createdAt: new Date(),
    };

    try {
      const user = await storage.createUser(userData);
      const token = generateToken(user);
      
      res.status(201).json({ 
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
          createdAt: user.createdAt
        }, 
        token 
      });
    } catch (error: any) {
      // Handle unique constraint violations
      if (error.code === '23505') {
        if (error.constraint === 'users_email_unique') {
          return res.status(400).json({ message: 'Oops! This email address is already in use. Please try another one.' });
        }
        if (error.constraint === 'users_username_unique') {
          return res.status(400).json({ message: 'Oops! This username is already taken. Please try another one.' });
        }
      }
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Failed to create account' });
    }
  });

  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    
    const user = await storage.getUserByUsername(username);
    if (!user || !(await comparePasswords(password, user.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

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
        createdAt: user.createdAt
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
}

// Middleware to require authentication
export function requireAuth(req: any, res: any, next: any) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

// Middleware to require admin role
export function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}
