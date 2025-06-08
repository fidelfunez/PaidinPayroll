import { 
  users, 
  payrollPayments, 
  expenseReimbursements, 
  btcRateHistory,
  timeTracking,
  timeOffRequests,
  notifications,
  messages,
  auditLogs,
  taxDocuments,
  type User, 
  type InsertUser,
  type PayrollPayment,
  type InsertPayrollPayment,
  type ExpenseReimbursement,
  type InsertExpenseReimbursement,
  type BtcRateHistory,
  type InsertBtcRateHistory,
  type TimeTracking,
  type InsertTimeTracking,
  type TimeOffRequest,
  type InsertTimeOffRequest,
  type Notification,
  type InsertNotification,
  type Message,
  type InsertMessage,
  type AuditLog,
  type InsertAuditLog,
  type TaxDocument,
  type InsertTaxDocument
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

  // Time tracking management
  createTimeTracking(timeEntry: InsertTimeTracking): Promise<TimeTracking>;
  getTimeTracking(userId?: number): Promise<TimeTracking[]>;
  updateTimeTracking(id: number, updates: Partial<TimeTracking>): Promise<TimeTracking | undefined>;
  clockOut(id: number): Promise<TimeTracking | undefined>;

  // Time off management
  createTimeOffRequest(request: InsertTimeOffRequest): Promise<TimeOffRequest>;
  getTimeOffRequests(userId?: number): Promise<TimeOffRequest[]>;
  updateTimeOffRequest(id: number, updates: Partial<TimeOffRequest>): Promise<TimeOffRequest | undefined>;
  getPendingTimeOffRequests(): Promise<TimeOffRequest[]>;

  // Notification management
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;

  // Message management
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(userId: number): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<Message | undefined>;

  // Audit log management
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;

  // Tax document management
  createTaxDocument(document: InsertTaxDocument): Promise<TaxDocument>;
  getTaxDocuments(userId?: number): Promise<TaxDocument[]>;
  deleteTaxDocument(id: number): Promise<boolean>;

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
    if (startDate && endDate) {
      return await db.select()
        .from(btcRateHistory)
        .where(
          and(
            gte(btcRateHistory.timestamp, startDate),
            lte(btcRateHistory.timestamp, endDate)
          )
        )
        .orderBy(desc(btcRateHistory.timestamp));
    }
    
    return await db.select()
      .from(btcRateHistory)
      .orderBy(desc(btcRateHistory.timestamp));
  }

  // Time tracking management
  async createTimeTracking(timeEntry: InsertTimeTracking): Promise<TimeTracking> {
    const [entry] = await db
      .insert(timeTracking)
      .values(timeEntry)
      .returning();
    return entry;
  }

  async getTimeTracking(userId?: number): Promise<TimeTracking[]> {
    const query = db.select().from(timeTracking);
    
    if (userId) {
      return await query
        .where(eq(timeTracking.userId, userId))
        .orderBy(desc(timeTracking.date));
    }
    
    return await query.orderBy(desc(timeTracking.date));
  }

  async updateTimeTracking(id: number, updates: Partial<TimeTracking>): Promise<TimeTracking | undefined> {
    const [entry] = await db
      .update(timeTracking)
      .set(updates)
      .where(eq(timeTracking.id, id))
      .returning();
    return entry || undefined;
  }

  async clockOut(id: number): Promise<TimeTracking | undefined> {
    const clockOutTime = new Date();
    const [entry] = await db
      .update(timeTracking)
      .set({ 
        clockOut: clockOutTime,
        hoursWorked: "8.00"
      })
      .where(eq(timeTracking.id, id))
      .returning();
    return entry || undefined;
  }

  // Time off management
  async createTimeOffRequest(request: InsertTimeOffRequest): Promise<TimeOffRequest> {
    const [timeOffRequest] = await db
      .insert(timeOffRequests)
      .values(request)
      .returning();
    return timeOffRequest;
  }

  async getTimeOffRequests(userId?: number): Promise<TimeOffRequest[]> {
    const query = db.select().from(timeOffRequests);
    
    if (userId) {
      return await query
        .where(eq(timeOffRequests.userId, userId))
        .orderBy(desc(timeOffRequests.createdAt));
    }
    
    return await query.orderBy(desc(timeOffRequests.createdAt));
  }

  async updateTimeOffRequest(id: number, updates: Partial<TimeOffRequest>): Promise<TimeOffRequest | undefined> {
    const [request] = await db
      .update(timeOffRequests)
      .set(updates)
      .where(eq(timeOffRequests.id, id))
      .returning();
    return request || undefined;
  }

  async getPendingTimeOffRequests(): Promise<TimeOffRequest[]> {
    return await db
      .select()
      .from(timeOffRequests)
      .where(eq(timeOffRequests.status, 'pending'))
      .orderBy(desc(timeOffRequests.createdAt));
  }

  // Notification management
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [notif] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return notif;
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return notification || undefined;
  }

  // Message management
  async createMessage(message: InsertMessage): Promise<Message> {
    const [msg] = await db
      .insert(messages)
      .values(message)
      .returning();
    return msg;
  }

  async getMessages(userId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.toUserId, userId))
      .orderBy(desc(messages.createdAt));
  }

  async markMessageAsRead(id: number): Promise<Message | undefined> {
    const [message] = await db
      .update(messages)
      .set({ isRead: true })
      .where(eq(messages.id, id))
      .returning();
    return message || undefined;
  }

  // Audit log management
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(auditLogs)
      .values(log)
      .returning();
    return auditLog;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(100);
  }

  // Tax document management
  async createTaxDocument(document: InsertTaxDocument): Promise<TaxDocument> {
    const [taxDoc] = await db
      .insert(taxDocuments)
      .values(document)
      .returning();
    return taxDoc;
  }

  async getTaxDocuments(userId?: number): Promise<TaxDocument[]> {
    const query = db.select().from(taxDocuments);
    
    if (userId) {
      return await query
        .where(eq(taxDocuments.userId, userId))
        .orderBy(desc(taxDocuments.uploadedAt));
    }
    
    return await query.orderBy(desc(taxDocuments.uploadedAt));
  }

  async deleteTaxDocument(id: number): Promise<boolean> {
    const result = await db
      .delete(taxDocuments)
      .where(eq(taxDocuments.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
