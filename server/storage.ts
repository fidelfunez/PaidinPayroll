import { 
  users, 
  payrollPayments, 
  expenseReimbursements, 
  btcRateHistory,
  type User, 
  type InsertUser,
  type PayrollPayment,
  type InsertPayrollPayment,
  type ExpenseReimbursement,
  type InsertExpenseReimbursement,
  type BtcRateHistory,
  type InsertBtcRateHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import session from "express-session";
import * as expressSession from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getEmployees(): Promise<User[]>;

  // Payroll management
  createPayrollPayment(payment: InsertPayrollPayment): Promise<PayrollPayment>;
  getPayrollPayments(userId?: number): Promise<PayrollPayment[]>;
  updatePayrollPayment(id: number, updates: Partial<PayrollPayment>): Promise<PayrollPayment | undefined>;
  getPendingPayrollPayments(): Promise<PayrollPayment[]>;

  // Expense management
  createExpenseReimbursement(expense: InsertExpenseReimbursement): Promise<ExpenseReimbursement>;
  getExpenseReimbursements(userId?: number): Promise<ExpenseReimbursement[]>;
  updateExpenseReimbursement(id: number, updates: Partial<ExpenseReimbursement>): Promise<ExpenseReimbursement | undefined>;
  getPendingExpenseReimbursements(): Promise<ExpenseReimbursement[]>;

  // BTC rate management
  saveBtcRate(rate: InsertBtcRateHistory): Promise<BtcRateHistory>;
  getLatestBtcRate(): Promise<BtcRateHistory | undefined>;
  getBtcRateHistory(startDate?: Date, endDate?: Date): Promise<BtcRateHistory[]>;

  sessionStore: expressSession.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: expressSession.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getEmployees(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  // Payroll management
  async createPayrollPayment(payment: InsertPayrollPayment): Promise<PayrollPayment> {
    const [payroll] = await db
      .insert(payrollPayments)
      .values(payment)
      .returning();
    return payroll;
  }

  async getPayrollPayments(userId?: number): Promise<PayrollPayment[]> {
    const query = db.select().from(payrollPayments).orderBy(desc(payrollPayments.createdAt));
    
    if (userId) {
      return await query.where(eq(payrollPayments.userId, userId));
    }
    
    return await query;
  }

  async updatePayrollPayment(id: number, updates: Partial<PayrollPayment>): Promise<PayrollPayment | undefined> {
    const [payment] = await db
      .update(payrollPayments)
      .set(updates)
      .where(eq(payrollPayments.id, id))
      .returning();
    return payment || undefined;
  }

  async getPendingPayrollPayments(): Promise<PayrollPayment[]> {
    return await db
      .select()
      .from(payrollPayments)
      .where(eq(payrollPayments.status, 'pending'))
      .orderBy(desc(payrollPayments.scheduledDate));
  }

  // Expense management
  async createExpenseReimbursement(expense: InsertExpenseReimbursement): Promise<ExpenseReimbursement> {
    const [reimbursement] = await db
      .insert(expenseReimbursements)
      .values(expense)
      .returning();
    return reimbursement;
  }

  async getExpenseReimbursements(userId?: number): Promise<ExpenseReimbursement[]> {
    const query = db.select().from(expenseReimbursements).orderBy(desc(expenseReimbursements.createdAt));
    
    if (userId) {
      return await query.where(eq(expenseReimbursements.userId, userId));
    }
    
    return await query;
  }

  async updateExpenseReimbursement(id: number, updates: Partial<ExpenseReimbursement>): Promise<ExpenseReimbursement | undefined> {
    const [expense] = await db
      .update(expenseReimbursements)
      .set(updates)
      .where(eq(expenseReimbursements.id, id))
      .returning();
    return expense || undefined;
  }

  async getPendingExpenseReimbursements(): Promise<ExpenseReimbursement[]> {
    return await db
      .select()
      .from(expenseReimbursements)
      .where(eq(expenseReimbursements.status, 'pending'))
      .orderBy(desc(expenseReimbursements.createdAt));
  }

  // BTC rate management
  async saveBtcRate(rate: InsertBtcRateHistory): Promise<BtcRateHistory> {
    const [btcRate] = await db
      .insert(btcRateHistory)
      .values(rate)
      .returning();
    return btcRate;
  }

  async getLatestBtcRate(): Promise<BtcRateHistory | undefined> {
    const [rate] = await db
      .select()
      .from(btcRateHistory)
      .orderBy(desc(btcRateHistory.timestamp))
      .limit(1);
    return rate || undefined;
  }

  async getBtcRateHistory(startDate?: Date, endDate?: Date): Promise<BtcRateHistory[]> {
    let query = db.select().from(btcRateHistory).orderBy(desc(btcRateHistory.timestamp));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          gte(btcRateHistory.timestamp, startDate),
          lte(btcRateHistory.timestamp, endDate)
        )
      );
    }
    
    return await query;
  }
}

export const storage = new DatabaseStorage();
