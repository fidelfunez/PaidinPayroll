import { pgTable, text, serial, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum('role', ['admin', 'employee']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'completed', 'failed']);
export const expenseStatusEnum = pgEnum('expense_status', ['pending', 'approved', 'rejected', 'paid']);
export const transactionTypeEnum = pgEnum('transaction_type', ['salary', 'reimbursement', 'bonus']);
export const timeOffStatusEnum = pgEnum('time_off_status', ['pending', 'approved', 'rejected']);
export const withdrawalMethodTypeEnum = pgEnum('withdrawal_method_type', ['btc', 'bank']);
export const notificationTypeEnum = pgEnum('notification_type', ['payment', 'expense', 'time_off', 'general']);
export const auditActionEnum = pgEnum('audit_action', ['create', 'update', 'delete', 'approve', 'reject']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default('employee'),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  btcAddress: text("btc_address"),
  bankAccountNumber: text("bank_account_number"),
  bankRoutingNumber: text("bank_routing_number"),
  bankAccountName: text("bank_account_name"),
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

// Time tracking table
export const timeTracking = pgTable("time_tracking", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  clockIn: timestamp("clock_in").notNull(),
  clockOut: timestamp("clock_out"),
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }),
  description: text("description"),
  date: timestamp("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Time off requests table
export const timeOffRequests = pgTable("time_off_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  days: integer("days").notNull(),
  reason: text("reason").notNull(),
  status: timeOffStatusEnum("status").notNull().default('pending'),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedDate: timestamp("approved_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").notNull().references(() => users.id),
  toUserId: integer("to_user_id").notNull().references(() => users.id),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: auditActionEnum("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: integer("resource_id"),
  details: text("details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Tax documents table
export const taxDocuments = pgTable("tax_documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  documentType: text("document_type").notNull(),
  documentName: text("document_name").notNull(),
  fileData: text("file_data").notNull(), // Base64 encoded file
  taxYear: integer("tax_year").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

// Session table for express-session storage
export const session = pgTable("session", {
  sid: text("sid").primaryKey().notNull(),
  sess: text("sess").notNull(), // JSON as text
  expire: timestamp("expire").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  payrollPayments: many(payrollPayments),
  expenseReimbursements: many(expenseReimbursements),
  approvedExpenses: many(expenseReimbursements, { relationName: "approver" }),
  timeTracking: many(timeTracking),
  timeOffRequests: many(timeOffRequests),
  approvedTimeOff: many(timeOffRequests, { relationName: "timeOffApprover" }),
  notifications: many(notifications),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "recipient" }),
  auditLogs: many(auditLogs),
  taxDocuments: many(taxDocuments),
}));

export const timeTrackingRelations = relations(timeTracking, ({ one }) => ({
  user: one(users, {
    fields: [timeTracking.userId],
    references: [users.id],
  }),
}));

export const timeOffRequestsRelations = relations(timeOffRequests, ({ one }) => ({
  user: one(users, {
    fields: [timeOffRequests.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [timeOffRequests.approvedBy],
    references: [users.id],
    relationName: "timeOffApprover",
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.fromUserId],
    references: [users.id],
    relationName: "sender",
  }),
  recipient: one(users, {
    fields: [messages.toUserId],
    references: [users.id],
    relationName: "recipient",
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const taxDocumentsRelations = relations(taxDocuments, ({ one }) => ({
  user: one(users, {
    fields: [taxDocuments.userId],
    references: [users.id],
  }),
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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
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

export const insertTimeTrackingSchema = createInsertSchema(timeTracking).omit({
  id: true,
  createdAt: true,
  date: true,
});

export const insertTimeOffRequestSchema = createInsertSchema(timeOffRequests).omit({
  id: true,
  createdAt: true,
  approvedBy: true,
  approvedDate: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertTaxDocumentSchema = createInsertSchema(taxDocuments).omit({
  id: true,
  uploadedAt: true,
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
export type TimeTracking = typeof timeTracking.$inferSelect;
export type InsertTimeTracking = z.infer<typeof insertTimeTrackingSchema>;
export type TimeOffRequest = typeof timeOffRequests.$inferSelect;
export type InsertTimeOffRequest = z.infer<typeof insertTimeOffRequestSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type TaxDocument = typeof taxDocuments.$inferSelect;
export type InsertTaxDocument = z.infer<typeof insertTaxDocumentSchema>;
