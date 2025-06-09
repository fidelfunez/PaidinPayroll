import { pgTable, text, serial, integer, boolean, timestamp, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum('role', ['admin', 'employee']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'completed', 'failed']);
export const expenseStatusEnum = pgEnum('expense_status', ['pending', 'approved', 'rejected', 'paid']);
export const transactionTypeEnum = pgEnum('transaction_type', ['salary', 'reimbursement', 'bonus']);

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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type PayrollPayment = typeof payrollPayments.$inferSelect;
export type InsertPayrollPayment = z.infer<typeof insertPayrollPaymentSchema>;
export type ExpenseReimbursement = typeof expenseReimbursements.$inferSelect;
export type InsertExpenseReimbursement = z.infer<typeof insertExpenseReimbursementSchema>;
export type BtcRateHistory = typeof btcRateHistory.$inferSelect;
export type InsertBtcRateHistory = z.infer<typeof insertBtcRateHistorySchema>;
