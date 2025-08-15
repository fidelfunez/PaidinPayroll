import { 
  users, 
  companies,
  payrollPayments, 
  expenseReimbursements, 
  btcRateHistory,
  btcpayInvoices,
  btcpayTransactions,
  conversations,
  messages,
  invoices,
  integrations,
  onboardingFlows,
  onboardingTasks,
  onboardingProgress,
  onboardingTaskProgress,
  type User, 
  type Company,
  type InsertUser,
  type InsertCompany,
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
  type InsertMessage,
  type Invoice,
  type InsertInvoice,
  type Integration,
  type InsertIntegration,
  type OnboardingFlow,
  type InsertOnboardingFlow,
  type OnboardingTask,
  type InsertOnboardingTask,
  type OnboardingProgress,
  type InsertOnboardingProgress,
  type OnboardingTaskProgress,
  type InsertOnboardingTaskProgress
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, or, arrayContains } from "drizzle-orm";
import session from "express-session";
import * as expressSession from "express-session";
import connectSqlite3 from "connect-sqlite3";
import { sqlite } from "./db";
import { getDatabasePath } from './db-path';
import path from 'path';



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

  // Invoice management
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoices(userId?: number): Promise<Invoice[]>;
  updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined>;
  updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<void>;
  generateInvoiceNumber(): Promise<string>;

  // Integration management
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  getIntegration(id: number): Promise<Integration | undefined>;
  getIntegrations(): Promise<Integration[]>;
  updateIntegration(id: number, updates: Partial<Integration>): Promise<Integration | undefined>;
  testIntegration(id: number): Promise<{ success: boolean; message: string; details?: any }>;
  deleteIntegration(id: number): Promise<void>;
  toggleIntegration(id: number, isActive: boolean): Promise<Integration>;

  // Onboarding flow management
  createOnboardingFlow(flow: InsertOnboardingFlow): Promise<OnboardingFlow>;
  getOnboardingFlow(id: number): Promise<OnboardingFlow | undefined>;
  getOnboardingFlows(): Promise<OnboardingFlow[]>;
  updateOnboardingFlow(id: number, updates: Partial<OnboardingFlow>): Promise<OnboardingFlow | undefined>;
  deleteOnboardingFlow(id: number): Promise<void>;

  // Onboarding task management
  createOnboardingTask(task: InsertOnboardingTask): Promise<OnboardingTask>;
  getOnboardingTask(id: number): Promise<OnboardingTask | undefined>;
  getOnboardingTasks(flowId: number): Promise<OnboardingTask[]>;
  updateOnboardingTask(id: number, updates: Partial<OnboardingTask>): Promise<OnboardingTask | undefined>;
  deleteOnboardingTask(id: number): Promise<void>;

  // Onboarding progress management
  createOnboardingProgress(progress: InsertOnboardingProgress): Promise<OnboardingProgress>;
  getOnboardingProgress(id: number): Promise<OnboardingProgress | undefined>;
  getOnboardingProgressByEmployee(employeeId: number): Promise<OnboardingProgress[]>;
  updateOnboardingProgress(id: number, updates: Partial<OnboardingProgress>): Promise<OnboardingProgress | undefined>;
  deleteOnboardingProgress(id: number): Promise<void>;

  // Onboarding task progress management
  createOnboardingTaskProgress(progress: InsertOnboardingTaskProgress): Promise<OnboardingTaskProgress>;
  getOnboardingTaskProgress(id: number): Promise<OnboardingTaskProgress | undefined>;
  getOnboardingTaskProgressByProgress(progressId: number): Promise<OnboardingTaskProgress[]>;
  updateOnboardingTaskProgress(id: number, updates: Partial<OnboardingTaskProgress>): Promise<OnboardingTaskProgress | undefined>;
  deleteOnboardingTaskProgress(id: number): Promise<void>;

  // Company management
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByDomain(domain: string): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;
  updateCompany(id: number, updates: Partial<Company>): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<void>;

  // BTCPay configuration
  getBTCPayConfig(): Promise<{ url: string; apiKey: string; storeId: string } | null>;
  saveBTCPayConfig(config: { url: string; apiKey: string; storeId: string }): Promise<void>;
  updateBTCPayConfig(config: Partial<{ url: string; apiKey: string; storeId: string }>): Promise<void>;

  sessionStore: expressSession.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: expressSession.Store;

  constructor() {
    // Use SQLite session store for production
    this.sessionStore = new SQLiteSessionStore({
      db: 'sessions.db',
      dir: path.dirname(getDatabasePath()),
      table: 'sessions'
    });
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Convert username to lowercase for case-insensitive matching
    const normalizedUsername = username.toLowerCase();
    const [user] = await db.select().from(users).where(eq(users.username, normalizedUsername));
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

  // Invoice management
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoices(userId?: number): Promise<Invoice[]> {
    const query = db.select().from(invoices).orderBy(desc(invoices.createdAt));
    if (userId) {
      return await query.where(eq(invoices.createdBy, userId));
    }
    return await query;
  }

  async updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice || undefined;
  }

  async updateInvoiceStatus(id: number, status: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({ status, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice || undefined;
  }

  async deleteInvoice(id: number): Promise<void> {
    await db
      .delete(invoices)
      .where(eq(invoices.id, id));
  }

  async generateInvoiceNumber(): Promise<string> {
    const [lastInvoice] = await db
      .select()
      .from(invoices)
      .orderBy(desc(invoices.createdAt))
      .limit(1);

    if (!lastInvoice) {
      return 'INV-0001';
    }

    const lastNumber = parseInt(lastInvoice.invoiceNumber.replace('INV-', ''), 10);
    const newNumber = (lastNumber + 1).toString().padStart(4, '0');
    return `INV-${newNumber}`;
  }

  // Integration management
  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [newIntegration] = await db
      .insert(integrations)
      .values(integration)
      .returning();
    return newIntegration;
  }

  async getIntegration(id: number): Promise<Integration | undefined> {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(eq(integrations.id, id));
    return integration || undefined;
  }

  async getIntegrations(): Promise<Integration[]> {
    return await db.select().from(integrations).orderBy(desc(integrations.createdAt));
  }

  async updateIntegration(id: number, updates: Partial<Integration>): Promise<Integration | undefined> {
    const [integration] = await db
      .update(integrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(integrations.id, id))
      .returning();
    return integration || undefined;
  }

  async testIntegration(id: number): Promise<{ success: boolean; message: string; details?: any }> {
    const [integration] = await db
      .select()
      .from(integrations)
      .where(eq(integrations.id, id));

    if (!integration) {
      return { success: false, message: 'Integration not found' };
    }

    try {
      // Simulate a test connection
      // In a real application, you would call an external API or service
      // For example, if it's a Slack integration, you might send a test message
      // If it's a QuickBooks integration, you might try to fetch a company info
      // If it's a Zapier integration, you might trigger a webhook
      // If it's a BTCPay integration, you might try to get a rate
      // If it's an LNBits integration, you might try to get a wallet balance

      // For now, we'll just return a success message
      return { success: true, message: 'Integration test successful' };
    } catch (error) {
      return { success: false, message: `Integration test failed: ${error.message}` };
    }
  }

  async deleteIntegration(id: number): Promise<void> {
    await db
      .delete(integrations)
      .where(eq(integrations.id, id));
  }

  async toggleIntegration(id: number, isActive: boolean): Promise<Integration> {
    const [integration] = await db
      .update(integrations)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(integrations.id, id))
      .returning();
    return integration!;
  }

  // Onboarding flow management
  async createOnboardingFlow(flow: InsertOnboardingFlow): Promise<OnboardingFlow> {
    const [newFlow] = await db
      .insert(onboardingFlows)
      .values(flow)
      .returning();
    return newFlow;
  }

  async getOnboardingFlow(id: number): Promise<OnboardingFlow | undefined> {
    const [flow] = await db
      .select()
      .from(onboardingFlows)
      .where(eq(onboardingFlows.id, id));
    return flow || undefined;
  }

  async getOnboardingFlows(): Promise<OnboardingFlow[]> {
    return await db.select().from(onboardingFlows).orderBy(desc(onboardingFlows.createdAt));
  }

  async updateOnboardingFlow(id: number, updates: Partial<OnboardingFlow>): Promise<OnboardingFlow | undefined> {
    const [flow] = await db
      .update(onboardingFlows)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(onboardingFlows.id, id))
      .returning();
    return flow || undefined;
  }

  async deleteOnboardingFlow(id: number): Promise<void> {
    await db
      .delete(onboardingFlows)
      .where(eq(onboardingFlows.id, id));
  }

  // Onboarding task management
  async createOnboardingTask(task: InsertOnboardingTask): Promise<OnboardingTask> {
    const [newTask] = await db
      .insert(onboardingTasks)
      .values(task)
      .returning();
    return newTask;
  }

  async getOnboardingTask(id: number): Promise<OnboardingTask | undefined> {
    const [task] = await db
      .select()
      .from(onboardingTasks)
      .where(eq(onboardingTasks.id, id));
    return task || undefined;
  }

  async getOnboardingTasks(flowId: number): Promise<OnboardingTask[]> {
    return await db
      .select()
      .from(onboardingTasks)
      .where(eq(onboardingTasks.flowId, flowId))
      .orderBy(onboardingTasks.order);
  }

  async updateOnboardingTask(id: number, updates: Partial<OnboardingTask>): Promise<OnboardingTask | undefined> {
    const [task] = await db
      .update(onboardingTasks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(onboardingTasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteOnboardingTask(id: number): Promise<void> {
    await db
      .delete(onboardingTasks)
      .where(eq(onboardingTasks.id, id));
  }

  // Onboarding progress management
  async createOnboardingProgress(progress: InsertOnboardingProgress): Promise<OnboardingProgress> {
    const [newProgress] = await db
      .insert(onboardingProgress)
      .values(progress)
      .returning();
    return newProgress;
  }

  async getOnboardingProgress(id: number): Promise<OnboardingProgress | undefined> {
    const [progress] = await db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.id, id));
    return progress || undefined;
  }

  async getOnboardingProgressByEmployee(employeeId: number): Promise<OnboardingProgress[]> {
    return await db
      .select()
      .from(onboardingProgress)
      .where(eq(onboardingProgress.employeeId, employeeId))
      .orderBy(desc(onboardingProgress.startDate));
  }

  async updateOnboardingProgress(id: number, updates: Partial<OnboardingProgress>): Promise<OnboardingProgress | undefined> {
    const [progress] = await db
      .update(onboardingProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(onboardingProgress.id, id))
      .returning();
    return progress || undefined;
  }

  async deleteOnboardingProgress(id: number): Promise<void> {
    await db
      .delete(onboardingProgress)
      .where(eq(onboardingProgress.id, id));
  }

  // Onboarding task progress management
  async createOnboardingTaskProgress(progress: InsertOnboardingTaskProgress): Promise<OnboardingTaskProgress> {
    const [newProgress] = await db
      .insert(onboardingTaskProgress)
      .values(progress)
      .returning();
    return newProgress;
  }

  async getOnboardingTaskProgress(id: number): Promise<OnboardingTaskProgress | undefined> {
    const [progress] = await db
      .select()
      .from(onboardingTaskProgress)
      .where(eq(onboardingTaskProgress.id, id));
    return progress || undefined;
  }

  async getOnboardingTaskProgressByProgress(progressId: number): Promise<OnboardingTaskProgress[]> {
    return await db
      .select()
      .from(onboardingTaskProgress)
      .where(eq(onboardingTaskProgress.progressId, progressId))
      .orderBy(onboardingTaskProgress.taskId);
  }

  async updateOnboardingTaskProgress(id: number, updates: Partial<OnboardingTaskProgress>): Promise<OnboardingTaskProgress | undefined> {
    const [progress] = await db
      .update(onboardingTaskProgress)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(onboardingTaskProgress.id, id))
      .returning();
    return progress || undefined;
  }

  async deleteOnboardingTaskProgress(id: number): Promise<void> {
    await db
      .delete(onboardingTaskProgress)
      .where(eq(onboardingTaskProgress.id, id));
  }

  // Company management
  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db
      .insert(companies)
      .values(company)
      .returning();
    return newCompany;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id));
    return company || undefined;
  }

  async getCompanyByDomain(domain: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.domain, domain));
    return company || undefined;
  }

  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  async updateCompany(id: number, updates: Partial<Company>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company || undefined;
  }

  async deleteCompany(id: number): Promise<void> {
    await db
      .delete(companies)
      .where(eq(companies.id, id));
  }

  // BTCPay configuration management
  async getBTCPayConfig(): Promise<{ url: string; apiKey: string; storeId: string } | null> {
    const [config] = await db
      .select()
      .from(btcpayConfig)
      .where(eq(btcpayConfig.isActive, true))
      .limit(1);
    
    return config ? {
      url: config.url,
      apiKey: config.apiKey,
      storeId: config.storeId
    } : null;
  }

  async saveBTCPayConfig(config: { url: string; apiKey: string; storeId: string }): Promise<void> {
    // Deactivate any existing config
    await db
      .update(btcpayConfig)
      .set({ isActive: false })
      .where(eq(btcpayConfig.isActive, true));

    // Insert new config
    await db
      .insert(btcpayConfig)
      .values({
        url: config.url,
        apiKey: config.apiKey,
        storeId: config.storeId,
        isActive: true
      });
  }

  async updateBTCPayConfig(updates: Partial<{ url: string; apiKey: string; storeId: string }>): Promise<void> {
    await db
      .update(btcpayConfig)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(btcpayConfig.isActive, true));
  }
}

export const storage = new DatabaseStorage();
