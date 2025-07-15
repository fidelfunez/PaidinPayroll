import { pgTable, text, serial, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum('role', ['admin', 'employee']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'completed', 'failed']);
export const withdrawalMethodEnum = pgEnum('withdrawal_method', ['bitcoin', 'bank_transfer', 'not_set']);
export const expenseStatusEnum = pgEnum('expense_status', ['pending', 'approved', 'rejected', 'paid']);
export const transactionTypeEnum = pgEnum('transaction_type', ['salary', 'reimbursement', 'bonus']);
export const btcpayInvoiceStatusEnum = pgEnum('btcpay_invoice_status', ['new', 'processing', 'settled', 'complete', 'expired', 'invalid']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default('employee'),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  bio: text("bio"),
  btcAddress: text("btc_address"),
  withdrawalMethod: withdrawalMethodEnum("withdrawal_method").notNull().default('not_set'),
  bankAccountDetails: text("bank_account_details"), // JSON string for bank details
  monthlySalary: decimal("monthly_salary", { precision: 10, scale: 2 }),
  profilePhoto: text("profile_photo"), // Base64 encoded image data
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payroll payments table
export const payrollPayments = pgTable("payroll_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amountUsd: decimal("amount_usd", { precision: 10, scale: 2 }).notNull(),
  amountBtc: decimal("amount_btc", { precision: 18, scale: 8 }).notNull(),
  btcRate: decimal("btc_rate", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").notNull().default('pending'),
  scheduledDate: timestamp("scheduled_date").notNull(),
  paidDate: timestamp("paid_date"),
  transactionHash: text("transaction_hash"),
  lnbitsPaymentHash: text("lnbits_payment_hash"),
  lnbitsInvoiceId: text("lnbits_invoice_id"),
  processingNotes: text("processing_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Expense reimbursements table
export const expenseReimbursements = pgTable("expense_reimbursements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  description: text("description").notNull(),
  category: text("category").notNull(),
  amountUsd: decimal("amount_usd", { precision: 10, scale: 2 }).notNull(),
  amountBtc: decimal("amount_btc", { precision: 18, scale: 8 }),
  btcRate: decimal("btc_rate", { precision: 10, scale: 2 }),
  status: expenseStatusEnum("status").notNull().default('pending'),
  receiptUrl: text("receipt_url"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedDate: timestamp("approved_date"),
  paidDate: timestamp("paid_date"),
  transactionHash: text("transaction_hash"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// BTC rate history for tracking exchange rates
export const btcRateHistory = pgTable("btc_rate_history", {
  id: serial("id").primaryKey(),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  source: text("source").notNull().default('coingecko'),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// BTCPay invoices table
export const btcpayInvoices = pgTable("btcpay_invoices", {
  id: serial("id").primaryKey(),
  btcpayInvoiceId: text("btcpay_invoice_id").notNull().unique(), // BTCPay's invoice ID
  orderId: text("order_id").notNull(),
  amountUsd: decimal("amount_usd", { precision: 10, scale: 2 }).notNull(),
  amountBtc: decimal("amount_btc", { precision: 18, scale: 8 }),
  currency: text("currency").notNull().default('USD'),
  description: text("description").notNull(),
  status: btcpayInvoiceStatusEnum("status").notNull().default('new'),
  statusMessage: text("status_message"),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  paymentUrl: text("payment_url"),
  lightningPaymentUrl: text("lightning_payment_url"),
  onChainPaymentUrl: text("onchain_payment_url"),
  totalPaid: decimal("total_paid", { precision: 18, scale: 8 }).default('0'),
  paymentMethod: text("payment_method"), // 'lightning' or 'onchain'
  transactionHash: text("transaction_hash"),
  paidDate: timestamp("paid_date"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// BTCPay invoice transactions table for tracking individual payments
export const btcpayTransactions = pgTable("btcpay_transactions", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => btcpayInvoices.id, { onDelete: "cascade" }),
  btcpayTransactionId: text("btcpay_transaction_id").notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  currency: text("currency").notNull(),
  confirmations: integer("confirmations").default(0),
  blockHeight: integer("block_height"),
  blockHash: text("block_hash"),
  txid: text("txid"),
  timestamp: timestamp("timestamp"),
  status: text("status").notNull(),
  paymentType: text("payment_type"), // 'lightning' or 'onchain'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Session table for express-session storage
export const session = pgTable("session", {
  sid: text("sid").primaryKey().notNull(),
  sess: text("sess").notNull(), // JSON as text
  expire: timestamp("expire").notNull(),
});

// Conversations table for messaging
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  participantIds: integer("participant_ids").array().notNull(),
  lastMessageId: integer("last_message_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages table for individual messages
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  readBy: integer("read_by").array().default([]).notNull(),
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
