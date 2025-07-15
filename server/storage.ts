import { 
  users, 
  payrollPayments, 
  expenseReimbursements, 
  btcRateHistory,
  btcpayInvoices,
  btcpayTransactions,
  conversations,
  messages,
  type User, 
  type InsertUser,
  type PayrollPayment,
  type InsertPayrollPayment,
  type ExpenseReimbursement,
  type InsertExpenseReimbursement,
  type BtcRateHistory,
  type InsertBtcRateHistory,
  type BtcpayInvoice,
  type InsertBtcpayInvoice,
  type BtcpayTransaction,
  type InsertBtcpayTransaction,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, or, arrayContains } from "drizzle-orm";
import session from "express-session";
import * as expressSession from "express-session";
import connectSqlite3 from "connect-sqlite3";
import { sqlite } from "./db";
import { getDatabasePath } from './db-path';

const SQLiteSessionStore = connectSqlite3(session);

export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getEmployees(): Promise<User[]>;
  getEmployeesWithWithdrawalMethods(): Promise<User[]>;

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

  // BTCPay invoice management
  createBtcpayInvoice(invoice: InsertBtcpayInvoice): Promise<BtcpayInvoice>;
  getBtcpayInvoice(id: number): Promise<BtcpayInvoice | undefined>;
  getBtcpayInvoiceByBtcpayId(btcpayInvoiceId: string): Promise<BtcpayInvoice | undefined>;
  updateBtcpayInvoice(id: number, updates: Partial<BtcpayInvoice>): Promise<BtcpayInvoice | undefined>;
  getBtcpayInvoices(): Promise<BtcpayInvoice[]>;
  getPendingBtcpayInvoices(): Promise<BtcpayInvoice[]>;
  
  // BTCPay transaction management
  createBtcpayTransaction(transaction: InsertBtcpayTransaction): Promise<BtcpayTransaction>;
  getBtcpayTransactions(invoiceId: number): Promise<BtcpayTransaction[]>;
  updateBtcpayTransaction(id: number, updates: Partial<BtcpayTransaction>): Promise<BtcpayTransaction | undefined>;

  // Messaging management
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getUserConversations(userId: number): Promise<Conversation[]>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getConversationMessages(conversationId: number, limit?: number, offset?: number): Promise<Message[]>;
  markMessageAsRead(messageId: number, userId: number): Promise<void>;
  getUnreadMessageCount(userId: number): Promise<number>;

  sessionStore: expressSession.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: expressSession.Store;

  constructor() {
    // Use the shared utility for the database path
    const dbPath = getDatabasePath();
    this.sessionStore = new SQLiteSessionStore({ 
      db: dbPath,
      table: 'sessions'
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
    return await db.select().from(users).where(eq(users.role, 'employee'));
  }

  async getEmployeesWithWithdrawalMethods(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, 'employee'))
      .orderBy(users.firstName, users.lastName);
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

  // BTCPay invoice management
  async createBtcpayInvoice(invoice: InsertBtcpayInvoice): Promise<BtcpayInvoice> {
    const [newInvoice] = await db
      .insert(btcpayInvoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async getBtcpayInvoice(id: number): Promise<BtcpayInvoice | undefined> {
    const [invoice] = await db
      .select()
      .from(btcpayInvoices)
      .where(eq(btcpayInvoices.id, id));
    return invoice || undefined;
  }

  async getBtcpayInvoiceByBtcpayId(btcpayInvoiceId: string): Promise<BtcpayInvoice | undefined> {
    const [invoice] = await db
      .select()
      .from(btcpayInvoices)
      .where(eq(btcpayInvoices.btcpayInvoiceId, btcpayInvoiceId));
    return invoice || undefined;
  }

  async updateBtcpayInvoice(id: number, updates: Partial<BtcpayInvoice>): Promise<BtcpayInvoice | undefined> {
    const [invoice] = await db
      .update(btcpayInvoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(btcpayInvoices.id, id))
      .returning();
    return invoice || undefined;
  }

  async getBtcpayInvoices(): Promise<BtcpayInvoice[]> {
    return await db.select().from(btcpayInvoices).orderBy(desc(btcpayInvoices.createdAt));
  }

  async getPendingBtcpayInvoices(): Promise<BtcpayInvoice[]> {
    return await db
      .select()
      .from(btcpayInvoices)
      .where(eq(btcpayInvoices.status, 'new'))
      .orderBy(desc(btcpayInvoices.createdAt));
  }
  
  // BTCPay transaction management
  async createBtcpayTransaction(transaction: InsertBtcpayTransaction): Promise<BtcpayTransaction> {
    const [newTransaction] = await db
      .insert(btcpayTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getBtcpayTransactions(invoiceId: number): Promise<BtcpayTransaction[]> {
    return await db
      .select()
      .from(btcpayTransactions)
      .where(eq(btcpayTransactions.invoiceId, invoiceId))
      .orderBy(desc(btcpayTransactions.timestamp));
  }

  async updateBtcpayTransaction(id: number, updates: Partial<BtcpayTransaction>): Promise<BtcpayTransaction | undefined> {
    const [transaction] = await db
      .update(btcpayTransactions)
      .set(updates)
      .where(eq(btcpayTransactions.id, id))
      .returning();
    return transaction || undefined;
  }

  // Messaging management
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async getUserConversations(userId: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(arrayContains(conversations.participantIds, [userId]))
      .orderBy(desc(conversations.updatedAt));
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const [conversation] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return conversation || undefined;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();

    // Update conversation's last message and timestamp
    await db
      .update(conversations)
      .set({ 
        lastMessageId: newMessage.id,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, message.conversationId));

    return newMessage;
  }

  async getConversationMessages(conversationId: number, limit: number = 50, offset: number = 0): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.timestamp))
      .limit(limit)
      .offset(offset);
  }

  async markMessageAsRead(messageId: number, userId: number): Promise<void> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));

    if (message && !message.readBy.includes(userId)) {
      await db
        .update(messages)
        .set({ readBy: [...message.readBy, userId] })
        .where(eq(messages.id, messageId));
    }
  }

  async getUnreadMessageCount(userId: number): Promise<number> {
    const userConversations = await this.getUserConversations(userId);
    let unreadCount = 0;

    for (const conversation of userConversations) {
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversation.id));

      const unreadMessages = conversationMessages.filter(
        msg => !msg.readBy.includes(userId) && msg.senderId !== userId
      );
      unreadCount += unreadMessages.length;
    }

    return unreadCount;
  }
}

export const storage = new DatabaseStorage();
