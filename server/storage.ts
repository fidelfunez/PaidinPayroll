import { 
  users, 
  payrollPayments, 
  expenseReimbursements, 
  btcRateHistory,
  session,
  conversations,
  messages,
  conversationParticipants,
  type User, 
  type InsertUser, 
  type PayrollPayment, 
  type InsertPayrollPayment,
  type ExpenseReimbursement, 
  type InsertExpenseReimbursement,
  type BtcRateHistory,
  type InsertBtcRateHistory,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type ConversationParticipant,
  type InsertConversationParticipant
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, ne, sql } from "drizzle-orm";
import expressSession from "express-session";
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

  // Chat methods
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversations(userId: number): Promise<any[]>;
  getConversationById(id: number): Promise<any>;
  addConversationParticipant(participant: InsertConversationParticipant): Promise<ConversationParticipant>;
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(conversationId: number): Promise<any[]>;
  markMessageAsRead(messageId: number, userId: number): Promise<void>;
  updateConversationTimestamp(conversationId: number): Promise<void>;
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

  // Chat methods
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [result] = await db.insert(conversations).values(conversation).returning();
    return result;
  }

  async getConversations(userId: number): Promise<any[]> {
    const result = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        type: conversations.type,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        lastMessage: messages.content,
        lastMessageTime: messages.createdAt,
        otherUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          profilePhoto: users.profilePhoto,
        },
        unreadCount: sql<number>`count(case when ${messages.readAt} is null and ${messages.senderId} != ${userId} then 1 end)`,
      })
      .from(conversations)
      .innerJoin(conversationParticipants, eq(conversations.id, conversationParticipants.conversationId))
      .leftJoin(
        conversationParticipants.as('otherParticipant'),
        and(
          eq(conversations.id, sql`${'otherParticipant'}.conversation_id`),
          ne(sql`${'otherParticipant'}.user_id`, userId)
        )
      )
      .leftJoin(users, eq(sql`${'otherParticipant'}.user_id`, users.id))
      .leftJoin(messages, eq(conversations.id, messages.conversationId))
      .where(eq(conversationParticipants.userId, userId))
      .groupBy(
        conversations.id,
        conversations.title,
        conversations.type,
        conversations.createdAt,
        conversations.updatedAt,
        messages.content,
        messages.createdAt,
        users.id,
        users.firstName,
        users.lastName,
        users.role,
        users.profilePhoto
      )
      .orderBy(desc(conversations.updatedAt));

    return result;
  }

  async getConversationById(id: number): Promise<any> {
    const [result] = await db
      .select({
        id: conversations.id,
        title: conversations.title,
        type: conversations.type,
        createdAt: conversations.createdAt,
        participants: sql<any[]>`json_agg(json_build_object('id', ${users.id}, 'firstName', ${users.firstName}, 'lastName', ${users.lastName}, 'role', ${users.role}, 'profilePhoto', ${users.profilePhoto}))`,
      })
      .from(conversations)
      .innerJoin(conversationParticipants, eq(conversations.id, conversationParticipants.conversationId))
      .innerJoin(users, eq(conversationParticipants.userId, users.id))
      .where(eq(conversations.id, id))
      .groupBy(conversations.id, conversations.title, conversations.type, conversations.createdAt);

    return result;
  }

  async addConversationParticipant(participant: InsertConversationParticipant): Promise<ConversationParticipant> {
    const [result] = await db.insert(conversationParticipants).values(participant).returning();
    return result;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();

    // Update conversation timestamp
    await this.updateConversationTimestamp(message.conversationId);

    return result;
  }

  async getMessages(conversationId: number): Promise<any[]> {
    const result = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
        readAt: messages.readAt,
        sender: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          profilePhoto: users.profilePhoto,
        },
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);

    return result;
  }

  async markMessageAsRead(messageId: number, userId: number): Promise<void> {
    await db
      .update(messages)
      .set({ readAt: new Date() })
      .where(and(eq(messages.id, messageId), ne(messages.senderId, userId)));
  }

  async updateConversationTimestamp(conversationId: number): Promise<void> {
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId));
  }
}

export const storage = new DatabaseStorage();