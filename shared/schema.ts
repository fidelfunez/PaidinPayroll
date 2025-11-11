import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums (SQLite doesn't have native enums, so we use text)
export const roleEnum = ['admin', 'employee', 'super_admin', 'platform_admin'] as const;
export const paymentStatusEnum = ['pending', 'processing', 'completed', 'failed'] as const;
export const withdrawalMethodEnum = ['bitcoin', 'bank_transfer', 'not_set'] as const;
export const expenseStatusEnum = ['pending', 'approved', 'rejected', 'paid'] as const;
export const transactionTypeEnum = ['salary', 'reimbursement', 'bonus'] as const;
export const btcpayInvoiceStatusEnum = ['new', 'processing', 'settled', 'complete', 'expired', 'invalid'] as const;
export const invoiceStatusEnum = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;
export const integrationTypeEnum = ['slack', 'quickbooks', 'zapier', 'btcpay', 'lnbits'] as const;
export const integrationStatusEnum = ['connected', 'disconnected', 'error'] as const;
export const taskTypeEnum = ['form', 'document', 'video', 'quiz', 'meeting', 'system'] as const;
export const taskStatusEnum = ['pending', 'in_progress', 'completed'] as const;
// Payment integration enums
export const plaidAccountTypeEnum = ['depository', 'credit', 'loan', 'investment', 'other'] as const;
export const plaidAccountStatusEnum = ['active', 'inactive', 'error'] as const;
export const paymentIntentStatusEnum = ['requires_payment_method', 'requires_confirmation', 'requires_action', 'processing', 'requires_capture', 'canceled', 'succeeded'] as const;
export const conversionStatusEnum = ['pending', 'quoted', 'executing', 'completed', 'failed', 'expired'] as const;
export const walletTypeEnum = ['company', 'employee'] as const;
export const walletStatusEnum = ['initializing', 'active', 'inactive', 'error'] as const;
export const transactionTypePaymentEnum = ['funding', 'payout', 'swap_btc_to_usd', 'swap_usd_to_btc', 'conversion'] as const;
export const webhookProviderEnum = ['stripe', 'strike', 'breez'] as const;
export const webhookEventStatusEnum = ['pending', 'processing', 'completed', 'failed'] as const;

// Companies table for multi-tenancy
export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  domain: text("domain"), // Optional custom domain
  logo: text("logo"), // Base64 encoded logo
  primaryColor: text("primary_color").default('#f97316'), // Orange default
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  // Subscription fields
  subscriptionPlan: text("subscription_plan").default('starter'),
  subscriptionStatus: text("subscription_status").default('active'),
  subscriptionStartDate: integer("subscription_start_date", { mode: 'timestamp' }),
  subscriptionEndDate: integer("subscription_end_date", { mode: 'timestamp' }),
  maxEmployees: integer("max_employees").default(10),
  monthlyFee: real("monthly_fee").default(29.99),
  billingEmail: text("billing_email"),
  paymentStatus: text("payment_status").default('current'),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: roleEnum }).notNull().default('employee'),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  bio: text("bio"),
  btcAddress: text("btc_address"),
  withdrawalMethod: text("withdrawal_method", { enum: withdrawalMethodEnum }).notNull().default('not_set'),
  bankAccountDetails: text("bank_account_details"), // JSON string for bank details
  monthlySalary: real("monthly_salary"),
  profilePhoto: text("profile_photo"), // Base64 encoded image data
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Payroll payments table
export const payrollPayments = sqliteTable("payroll_payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  amountUsd: real("amount_usd").notNull(),
  amountBtc: real("amount_btc").notNull(),
  btcRate: real("btc_rate").notNull(),
  status: text("status", { enum: paymentStatusEnum }).notNull().default('pending'),
  scheduledDate: integer("scheduled_date", { mode: 'timestamp' }).notNull(),
  paidDate: integer("paid_date", { mode: 'timestamp' }),
  transactionHash: text("transaction_hash"),
  lnbitsPaymentHash: text("lnbits_payment_hash"),
  lnbitsInvoiceId: text("lnbits_invoice_id"),
  processingNotes: text("processing_notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Role changes audit table
export const roleChanges = sqliteTable("role_changes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  oldRole: text("old_role", { enum: roleEnum }).notNull(),
  newRole: text("new_role", { enum: roleEnum }).notNull(),
  changedBy: integer("changed_by").notNull().references(() => users.id),
  reason: text("reason"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Expense reimbursements table
export const expenseReimbursements = sqliteTable("expense_reimbursements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  description: text("description").notNull(),
  category: text("category").notNull(),
  amountUsd: real("amount_usd").notNull(),
  amountBtc: real("amount_btc"),
  btcRate: real("btc_rate"),
  status: text("status", { enum: expenseStatusEnum }).notNull().default('pending'),
  receiptUrl: text("receipt_url"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedDate: integer("approved_date", { mode: 'timestamp' }),
  paidDate: integer("paid_date", { mode: 'timestamp' }),
  transactionHash: text("transaction_hash"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// BTC rate history for tracking exchange rates (SHARED - no company_id)
export const btcRateHistory = sqliteTable("btc_rate_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rate: real("rate").notNull(),
  source: text("source").notNull().default('coingecko'),
  timestamp: integer("timestamp", { mode: 'timestamp' }).notNull().default(Date.now),
});

// BTCPay invoices table
export const btcpayInvoices = sqliteTable("btcpay_invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  btcpayInvoiceId: text("btcpay_invoice_id").notNull().unique(), // BTCPay's invoice ID
  orderId: text("order_id").notNull(),
  amountUsd: real("amount_usd").notNull(),
  amountBtc: real("amount_btc"),
  currency: text("currency").notNull().default('USD'),
  description: text("description").notNull(),
  status: text("status", { enum: btcpayInvoiceStatusEnum }).notNull().default('new'),
  statusMessage: text("status_message"),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  paymentUrl: text("payment_url"),
  lightningPaymentUrl: text("lightning_payment_url"),
  onChainPaymentUrl: text("onchain_payment_url"),
  totalPaid: real("total_paid").default(0),
  paymentMethod: text("payment_method"), // 'lightning' or 'onchain'
  transactionHash: text("transaction_hash"),
  paidDate: integer("paid_date", { mode: 'timestamp' }),
  expiresAt: integer("expires_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// BTCPay invoice transactions table for tracking individual payments
export const btcpayTransactions = sqliteTable("btcpay_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceId: integer("invoice_id").notNull().references(() => btcpayInvoices.id, { onDelete: "cascade" }),
  btcpayTransactionId: text("btcpay_transaction_id").notNull(),
  amount: real("amount").notNull(),
  currency: text("currency").notNull(),
  confirmations: integer("confirmations").default(0),
  blockHeight: integer("block_height"),
  blockHash: text("block_hash"),
  txid: text("txid"),
  timestamp: integer("timestamp", { mode: 'timestamp' }),
  status: text("status").notNull(),
  paymentType: text("payment_type"), // 'lightning' or 'onchain'
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Session table for express-session storage (SHARED - no company_id)
export const session = sqliteTable("session", {
  sid: text("sid").primaryKey().notNull(),
  sess: text("sess").notNull(), // JSON as text
  expire: integer("expire", { mode: 'timestamp' }).notNull(),
});

// Conversations table for messaging
export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  participantIds: text("participant_ids").notNull(), // JSON array as text
  lastMessageId: integer("last_message_id"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Messages table for individual messages
export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  timestamp: integer("timestamp", { mode: 'timestamp' }).notNull().default(Date.now),
  readBy: text("read_by").notNull().default('[]'), // JSON array as text
});

// Invoices table
export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  amountUsd: real("amount_usd").notNull(),
  amountBtc: real("amount_btc"),
  description: text("description").notNull(),
  status: text("status", { enum: invoiceStatusEnum }).notNull().default('draft'),
  dueDate: integer("due_date", { mode: 'timestamp' }),
  paidDate: integer("paid_date", { mode: 'timestamp' }),
  btcAddress: text("btc_address"),
  paymentUrl: text("payment_url"),
  transactionHash: text("transaction_hash"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Integrations table
export const integrations = sqliteTable("integrations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  type: text("type", { enum: integrationTypeEnum }).notNull(),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  status: text("status", { enum: integrationStatusEnum }).notNull().default('disconnected'),
  config: text("config").notNull(), // JSON string for configuration
  lastSync: integer("last_sync", { mode: 'timestamp' }),
  lastError: text("last_error"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Onboarding flows table
export const onboardingFlows = sqliteTable("onboarding_flows", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  department: text("department").notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Onboarding tasks table
export const onboardingTasks = sqliteTable("onboarding_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  flowId: integer("flow_id").notNull().references(() => onboardingFlows.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type", { enum: taskTypeEnum }).notNull(),
  description: text("description").notNull(),
  required: integer("required", { mode: 'boolean' }).notNull().default(true),
  order: integer("order").notNull(),
  estimatedTime: integer("estimated_time"), // in minutes
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Onboarding progress table
export const onboardingProgress = sqliteTable("onboarding_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  flowId: integer("flow_id").notNull().references(() => onboardingFlows.id),
  employeeId: integer("employee_id").notNull().references(() => users.id),
  progress: real("progress").notNull().default(0), // percentage 0-100
  startDate: integer("start_date", { mode: 'timestamp' }).notNull().default(Date.now),
  completedDate: integer("completed_date", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Onboarding task progress table
export const onboardingTaskProgress = sqliteTable("onboarding_task_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  progressId: integer("progress_id").notNull().references(() => onboardingProgress.id, { onDelete: "cascade" }),
  taskId: integer("task_id").notNull().references(() => onboardingTasks.id),
  status: text("status", { enum: taskStatusEnum }).notNull().default('pending'),
  completedAt: integer("completed_at", { mode: 'timestamp' }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// BTCPay configuration table
export const btcpayConfig = sqliteTable("btcpay_config", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  url: text("url").notNull(),
  apiKey: text("api_key").notNull(),
  storeId: text("store_id").notNull(),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  payrollPayments: many(payrollPayments),
  expenseReimbursements: many(expenseReimbursements),
  btcpayInvoices: many(btcpayInvoices),
  conversations: many(conversations),
  invoices: many(invoices),
  integrations: many(integrations),
  onboardingFlows: many(onboardingFlows),
  btcpayConfig: many(btcpayConfig),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  payrollPayments: many(payrollPayments),
  expenseReimbursements: many(expenseReimbursements),
  approvedExpenses: many(expenseReimbursements, { relationName: "approver" }),
  sentMessages: many(messages),
  roleChanges: many(roleChanges, { relationName: 'userRoleChanges' }),
  roleChangesMade: many(roleChanges, { relationName: 'roleChangesByUser' }),
}));

export const roleChangesRelations = relations(roleChanges, ({ one }) => ({
  user: one(users, {
    fields: [roleChanges.userId],
    references: [users.id],
    relationName: 'userRoleChanges',
  }),
  changedByUser: one(users, {
    fields: [roleChanges.changedBy],
    references: [users.id],
    relationName: 'roleChangesByUser',
  }),
}));

export const payrollPaymentsRelations = relations(payrollPayments, ({ one }) => ({
  company: one(companies, {
    fields: [payrollPayments.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [payrollPayments.userId],
    references: [users.id],
  }),
}));

export const expenseReimbursementsRelations = relations(expenseReimbursements, ({ one }) => ({
  company: one(companies, {
    fields: [expenseReimbursements.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [expenseReimbursements.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [expenseReimbursements.approvedBy],
    references: [users.id],
    relationName: "approver",
  }),
}));

export const btcpayInvoicesRelations = relations(btcpayInvoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [btcpayInvoices.companyId],
    references: [companies.id],
  }),
  transactions: many(btcpayTransactions),
}));

export const btcpayTransactionsRelations = relations(btcpayTransactions, ({ one }) => ({
  invoice: one(btcpayInvoices, {
    fields: [btcpayTransactions.invoiceId],
    references: [btcpayInvoices.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  company: one(companies, {
    fields: [conversations.companyId],
    references: [companies.id],
  }),
  messages: many(messages),
  lastMessage: one(messages, {
    fields: [conversations.lastMessageId],
    references: [messages.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// Relations for new tables
export const invoicesRelations = relations(invoices, ({ one }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  creator: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  company: one(companies, {
    fields: [integrations.companyId],
    references: [companies.id],
  }),
  creator: one(users, {
    fields: [integrations.createdBy],
    references: [users.id],
  }),
}));

export const onboardingFlowsRelations = relations(onboardingFlows, ({ one, many }) => ({
  company: one(companies, {
    fields: [onboardingFlows.companyId],
    references: [companies.id],
  }),
  creator: one(users, {
    fields: [onboardingFlows.createdBy],
    references: [users.id],
  }),
  tasks: many(onboardingTasks),
  progress: many(onboardingProgress),
}));

export const onboardingTasksRelations = relations(onboardingTasks, ({ one, many }) => ({
  flow: one(onboardingFlows, {
    fields: [onboardingTasks.flowId],
    references: [onboardingFlows.id],
  }),
  taskProgress: many(onboardingTaskProgress),
}));

export const onboardingProgressRelations = relations(onboardingProgress, ({ one, many }) => ({
  flow: one(onboardingFlows, {
    fields: [onboardingProgress.flowId],
    references: [onboardingFlows.id],
  }),
  employee: one(users, {
    fields: [onboardingProgress.employeeId],
    references: [users.id],
  }),
  taskProgress: many(onboardingTaskProgress),
}));

export const onboardingTaskProgressRelations = relations(onboardingTaskProgress, ({ one }) => ({
  progress: one(onboardingProgress, {
    fields: [onboardingTaskProgress.progressId],
    references: [onboardingProgress.id],
  }),
  task: one(onboardingTasks, {
    fields: [onboardingTaskProgress.taskId],
    references: [onboardingTasks.id],
  }),
}));

export const btcpayConfigRelations = relations(btcpayConfig, ({ one }) => ({
  company: one(companies, {
    fields: [btcpayConfig.companyId],
    references: [companies.id],
  }),
}));

// Password validation regex
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Insert schemas
export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(strongPasswordRegex, "Password must contain at least 1 uppercase letter, 1 number, and 1 special character"),
  monthlySalary: z.string().optional().transform((val) => val === "" ? null : parseFloat(val || "0")),
});

export const insertPayrollPaymentSchema = createInsertSchema(payrollPayments).omit({
  id: true,
  createdAt: true,
  paidDate: true,
  transactionHash: true,
});

export const insertExpenseReimbursementSchema = createInsertSchema(expenseReimbursements).omit({
  id: true,
  createdAt: true,
  amountBtc: true,
  btcRate: true,
  approvedBy: true,
  approvedDate: true,
  paidDate: true,
  transactionHash: true,
});

export const insertBtcRateHistorySchema = createInsertSchema(btcRateHistory).omit({
  id: true,
  timestamp: true,
});

export const insertBtcpayInvoiceSchema = createInsertSchema(btcpayInvoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidDate: true,
  totalPaid: true,
  transactionHash: true,
});

export const insertBtcpayTransactionSchema = createInsertSchema(btcpayTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastMessageId: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  timestamp: true,
  readBy: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices);
export const insertIntegrationSchema = createInsertSchema(integrations);
export const insertOnboardingFlowSchema = createInsertSchema(onboardingFlows);
export const insertOnboardingTaskSchema = createInsertSchema(onboardingTasks);
export const insertOnboardingProgressSchema = createInsertSchema(onboardingProgress);
export const insertOnboardingTaskProgressSchema = createInsertSchema(onboardingTaskProgress);

// Insert schemas for new tables
export const insertBtcpayConfigSchema = createInsertSchema(btcpayConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PayrollPayment = typeof payrollPayments.$inferSelect;
export type InsertPayrollPayment = z.infer<typeof insertPayrollPaymentSchema>;
export type ExpenseReimbursement = typeof expenseReimbursements.$inferSelect;
export type InsertExpenseReimbursement = z.infer<typeof insertExpenseReimbursementSchema>;
export type BtcRateHistory = typeof btcRateHistory.$inferSelect;
export type InsertBtcRateHistory = z.infer<typeof insertBtcRateHistorySchema>;
export type BtcpayInvoice = typeof btcpayInvoices.$inferSelect;
export type InsertBtcpayInvoice = z.infer<typeof insertBtcpayInvoiceSchema>;
export type BtcpayTransaction = typeof btcpayTransactions.$inferSelect;
export type InsertBtcpayTransaction = z.infer<typeof insertBtcpayTransactionSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type OnboardingFlow = typeof onboardingFlows.$inferSelect;
export type InsertOnboardingFlow = z.infer<typeof insertOnboardingFlowSchema>;
export type OnboardingTask = typeof onboardingTasks.$inferSelect;
export type InsertOnboardingTask = z.infer<typeof insertOnboardingTaskSchema>;
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgress = z.infer<typeof insertOnboardingProgressSchema>;
export type OnboardingTaskProgress = typeof onboardingTaskProgress.$inferSelect;
export type InsertOnboardingTaskProgress = z.infer<typeof insertOnboardingTaskProgressSchema>;
export type RoleChange = typeof roleChanges.$inferSelect;
export type InsertRoleChange = typeof roleChanges.$inferInsert;

// Payment Integration Tables

// Plaid accounts table - Store connected bank accounts
export const plaidAccounts = sqliteTable("plaid_accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  plaidItemId: text("plaid_item_id").notNull(),
  plaidAccessToken: text("plaid_access_token").notNull(), // Encrypted
  accountId: text("account_id").notNull(),
  accountName: text("account_name").notNull(),
  accountType: text("account_type", { enum: plaidAccountTypeEnum }).notNull(),
  accountMask: text("account_mask"),
  institutionId: text("institution_id").notNull(),
  institutionName: text("institution_name").notNull(),
  status: text("status", { enum: plaidAccountStatusEnum }).notNull().default('active'),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Payment intents table - Track Stripe payment intents
export const paymentIntents = sqliteTable("payment_intents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull().unique(),
  amount: real("amount").notNull(), // Amount in cents
  currency: text("currency").notNull().default('usd'),
  status: text("status", { enum: paymentIntentStatusEnum }).notNull().default('requires_payment_method'),
  plaidAccountId: integer("plaid_account_id").notNull().references(() => plaidAccounts.id),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Conversions table - Track USD to BTC conversions via Strike
export const conversions = sqliteTable("conversions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  paymentIntentId: integer("payment_intent_id").notNull().references(() => paymentIntents.id),
  strikeQuoteId: text("strike_quote_id").notNull(),
  amountUsd: real("amount_usd").notNull(),
  amountBtc: real("amount_btc").notNull(),
  exchangeRate: real("exchange_rate").notNull(),
  status: text("status", { enum: conversionStatusEnum }).notNull().default('pending'),
  strikeInvoiceId: text("strike_invoice_id"),
  completedAt: integer("completed_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Breez wallets table - Track Breez wallet instances
export const breezWallets = sqliteTable("breez_wallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").references(() => users.id), // Null for company wallets
  walletType: text("wallet_type", { enum: walletTypeEnum }).notNull(),
  breezNodeId: text("breez_node_id").notNull().unique(),
  balance: real("balance").notNull().default(0), // Balance in sats
  invoiceCapability: integer("invoice_capability", { mode: 'boolean' }).notNull().default(true),
  status: text("status", { enum: walletStatusEnum }).notNull().default('initializing'),
  lastSyncAt: integer("last_sync_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Wallet transactions table - Unified transaction ledger
export const walletTransactions = sqliteTable("wallet_transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  userId: integer("user_id").notNull().references(() => users.id),
  transactionType: text("transaction_type", { enum: transactionTypePaymentEnum }).notNull(),
  sourceType: text("source_type").notNull(), // 'stripe', 'strike', 'breez', etc.
  sourceId: text("source_id").notNull(), // ID from the source system
  amount: real("amount").notNull(),
  currency: text("currency").notNull(), // 'usd', 'btc', 'sats'
  status: text("status", { enum: paymentStatusEnum }).notNull().default('pending'),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Webhook events table - Audit log for all webhook events
export const webhookEvents = sqliteTable("webhook_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  provider: text("provider", { enum: webhookProviderEnum }).notNull(),
  eventType: text("event_type").notNull(),
  eventId: text("event_id").notNull(),
  payload: text("payload").notNull(), // JSON string of the webhook payload
  processed: integer("processed", { mode: 'boolean' }).notNull().default(false),
  processedAt: integer("processed_at", { mode: 'timestamp' }),
  error: text("error"), // Error message if processing failed
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Relations for payment integration tables
export const plaidAccountsRelations = relations(plaidAccounts, ({ one, many }) => ({
  company: one(companies, {
    fields: [plaidAccounts.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [plaidAccounts.userId],
    references: [users.id],
  }),
  paymentIntents: many(paymentIntents),
}));

export const paymentIntentsRelations = relations(paymentIntents, ({ one, many }) => ({
  company: one(companies, {
    fields: [paymentIntents.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [paymentIntents.userId],
    references: [users.id],
  }),
  plaidAccount: one(plaidAccounts, {
    fields: [paymentIntents.plaidAccountId],
    references: [plaidAccounts.id],
  }),
  conversions: many(conversions),
}));

export const conversionsRelations = relations(conversions, ({ one }) => ({
  company: one(companies, {
    fields: [conversions.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [conversions.userId],
    references: [users.id],
  }),
  paymentIntent: one(paymentIntents, {
    fields: [conversions.paymentIntentId],
    references: [paymentIntents.id],
  }),
}));

export const breezWalletsRelations = relations(breezWallets, ({ one }) => ({
  company: one(companies, {
    fields: [breezWallets.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [breezWallets.userId],
    references: [users.id],
  }),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  company: one(companies, {
    fields: [walletTransactions.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [walletTransactions.userId],
    references: [users.id],
  }),
}));

// Types for new tables
export type BtcpayConfig = typeof btcpayConfig.$inferSelect;
export type InsertBtcpayConfig = z.infer<typeof insertBtcpayConfigSchema>;

// Payment integration types
export type PlaidAccount = typeof plaidAccounts.$inferSelect;
export type InsertPlaidAccount = typeof plaidAccounts.$inferInsert;
export type PaymentIntent = typeof paymentIntents.$inferSelect;
export type InsertPaymentIntent = typeof paymentIntents.$inferInsert;
export type Conversion = typeof conversions.$inferSelect;
export type InsertConversion = typeof conversions.$inferInsert;
export type BreezWallet = typeof breezWallets.$inferSelect;
export type InsertBreezWallet = typeof breezWallets.$inferInsert;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = typeof webhookEvents.$inferInsert;
