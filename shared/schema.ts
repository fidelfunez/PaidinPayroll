import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums (SQLite doesn't have native enums, so we use text)
export const roleEnum = ['admin', 'employee'] as const;
export const paymentStatusEnum = ['pending', 'processing', 'completed', 'failed'] as const;
export const withdrawalMethodEnum = ['bitcoin', 'bank_transfer', 'not_set'] as const;
export const expenseStatusEnum = ['pending', 'approved', 'rejected', 'paid'] as const;
export const transactionTypeEnum = ['salary', 'reimbursement', 'bonus'] as const;
export const btcpayInvoiceStatusEnum = ['new', 'processing', 'settled', 'complete', 'expired', 'invalid'] as const;

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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

// Expense reimbursements table
export const expenseReimbursements = sqliteTable("expense_reimbursements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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

// BTC rate history for tracking exchange rates
export const btcRateHistory = sqliteTable("btc_rate_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  rate: real("rate").notNull(),
  source: text("source").notNull().default('coingecko'),
  timestamp: integer("timestamp", { mode: 'timestamp' }).notNull().default(Date.now),
});

// BTCPay invoices table
export const btcpayInvoices = sqliteTable("btcpay_invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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

// Session table for express-session storage
export const session = sqliteTable("session", {
  sid: text("sid").primaryKey().notNull(),
  sess: text("sess").notNull(), // JSON as text
  expire: integer("expire", { mode: 'timestamp' }).notNull(),
});

// Conversations table for messaging
export const conversations = sqliteTable("conversations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  payrollPayments: many(payrollPayments),
  expenseReimbursements: many(expenseReimbursements),
  approvedExpenses: many(expenseReimbursements, { relationName: "approver" }),
  sentMessages: many(messages),
}));

export const payrollPaymentsRelations = relations(payrollPayments, ({ one }) => ({
  user: one(users, {
    fields: [payrollPayments.userId],
    references: [users.id],
  }),
}));

export const expenseReimbursementsRelations = relations(expenseReimbursements, ({ one }) => ({
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

export const btcpayInvoicesRelations = relations(btcpayInvoices, ({ many }) => ({
  transactions: many(btcpayTransactions),
}));

export const btcpayTransactionsRelations = relations(btcpayTransactions, ({ one }) => ({
  invoice: one(btcpayInvoices, {
    fields: [btcpayTransactions.invoiceId],
    references: [btcpayInvoices.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ many, one }) => ({
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

// Password validation regex
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Insert schemas
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

// Types
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
