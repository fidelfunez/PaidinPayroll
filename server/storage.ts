import { 
  users, 
  companies,
  type User, 
  type Company,
  type InsertUser,
  type InsertCompany,
} from "@shared/schema";
import { db } from "./db";
import { eq, or, sql } from "drizzle-orm";
import session from "express-session";
import connectSqlite3 from "connect-sqlite3";
import { getDatabasePath } from './db-path';
import path from 'path';
import fs from 'fs';

const SQLiteSessionStore = connectSqlite3(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsernameOrEmail(loginField: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Company management
  getCompany(id: number): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;
  getCompanyBySlug(slug: string): Promise<Company | undefined>;
  getCompanyByDomain(domain: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, updates: Partial<Company>): Promise<Company | undefined>;

  // Session store
  sessionStore: any;
}

class Storage implements IStorage {
  public sessionStore: any;

  constructor() {
    const dbPath = getDatabasePath();
    // For sessions, use a separate file in the same directory
    const sessionDbPath = dbPath.replace('paidin.db', 'sessions.db');
    const sessionDbDir = path.dirname(sessionDbPath);
    
    console.log(`🔍 Initializing session store...`);
    console.log(`   Session DB path: ${sessionDbPath}`);
    console.log(`   Session DB directory: ${sessionDbDir}`);
    
    // Ensure directory exists
    try {
      if (!fs.existsSync(sessionDbDir)) {
        console.log(`📁 Creating session database directory: ${sessionDbDir}`);
        fs.mkdirSync(sessionDbDir, { recursive: true });
        console.log(`✅ Session database directory created: ${sessionDbDir}`);
      } else {
        console.log(`✅ Session database directory exists: ${sessionDbDir}`);
      }
      
      // Verify directory is writable
      try {
        fs.accessSync(sessionDbDir, fs.constants.W_OK);
        console.log(`✅ Session database directory is writable: ${sessionDbDir}`);
      } catch (accessError: any) {
        console.error(`❌ Session database directory is NOT writable: ${sessionDbDir}`, accessError);
        throw new Error(`Session database directory is not writable: ${sessionDbDir}`);
      }
    } catch (error: any) {
      console.error('❌ Failed to create/verify session database directory:', error);
      // Continue anyway - will fall back to memory store
    }
    
    try {
      console.log(`📂 Opening session database at: ${sessionDbPath}`);
      this.sessionStore = new SQLiteSessionStore({
        db: sessionDbPath,
        table: 'session',
      });
      console.log(`✅ Session store initialized successfully`);
    } catch (error: any) {
      console.error('❌ Failed to initialize session store:', error);
      console.error('   Error details:', error.message);
      console.error('   Stack:', error.stack);
      // Fallback to memory store if SQLite session store fails
      // Note: MemoryStore warning is expected in production, but it's better than crashing
      this.sessionStore = undefined; // Will use default MemoryStore from express-session
      console.log('⚠️  Falling back to MemoryStore for sessions');
    }
  }

  // ===========================
  // USER MANAGEMENT
  // ===========================

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(sql`LOWER(${users.username})`, username.toLowerCase()))
      .limit(1);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(sql`LOWER(${users.email})`, email.toLowerCase()))
      .limit(1);
    return user;
  }

  async getUserByUsernameOrEmail(loginField: string): Promise<User | undefined> {
    const lowerLoginField = loginField.toLowerCase();
    const [user] = await db.select()
      .from(users)
      .where(
        or(
          eq(sql`LOWER(${users.username})`, lowerLoginField),
          eq(sql`LOWER(${users.email})`, lowerLoginField)
        )
      )
      .limit(1);
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // ===========================
  // COMPANY MANAGEMENT
  // ===========================

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return company;
  }

  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async getCompanyBySlug(slug: string): Promise<Company | undefined> {
    const [company] = await db.select()
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);
    return company;
  }

  async getCompanyByDomain(domain: string): Promise<Company | undefined> {
    const [company] = await db.select()
      .from(companies)
      .where(eq(companies.domain, domain))
      .limit(1);
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: number, updates: Partial<Company>): Promise<Company | undefined> {
    const [updatedCompany] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }
}

export const storage = new Storage();
