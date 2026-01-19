import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// ===========================
// CORE ENUMS
// ===========================
export const roleEnum = ['admin', 'user'] as const;
export const walletTypeEnum = ['on-chain', 'lightning'] as const;
export const transactionStatusEnum = ['pending', 'confirmed', 'failed'] as const;
export const transactionDirectionEnum = ['received', 'sent'] as const;
export const categoryTypeEnum = ['income', 'expense', 'asset', 'liability'] as const;

// ===========================
// CORE TABLES (Keep from old system)
// ===========================

// Companies table for multi-tenancy
export const companies = sqliteTable("companies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull(),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull(),
});

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: integer("company_id").notNull().references(() => companies.id),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: roleEnum }).notNull().default('user'),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  profilePhoto: text("profile_photo"),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  emailVerified: integer("email_verified", { mode: 'boolean' }).default(false).notNull(),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationTokenExpiry: integer("email_verification_token_expiry", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull(),
});

// Session table for express-session storage
export const session = sqliteTable("session", {
  sid: text("sid").primaryKey().notNull(),
  sess: text("sess").notNull(), // JSON as text
  expired: integer("expired", { mode: 'timestamp' }).notNull(),
});

// ===========================
// BITCOIN ACCOUNTING TABLES (NEW)
// ===========================

// Wallets table - Track Bitcoin wallets (on-chain, Lightning, etc.)
export const wallets = sqliteTable("wallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  walletType: text("wallet_type", { enum: walletTypeEnum }).notNull(),
  walletData: text("wallet_data").notNull(), // JSON: xpub, addresses, connection info
  name: text("name").notNull(),
  network: text("network").notNull().default('mainnet'), // mainnet or testnet
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true), // Soft delete flag
  deletedAt: integer("deleted_at", { mode: 'timestamp' }), // Timestamp when archived
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Transactions table - All Bitcoin transactions
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  walletId: integer("wallet_id").notNull().references(() => wallets.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  txId: text("tx_id").notNull(), // transaction hash or payment hash
  amountBtc: real("amount_btc").notNull(),
  usdValue: real("usd_value").notNull(),
  feeBtc: real("fee_btc").default(0).notNull(),
  feeUsd: real("fee_usd").default(0).notNull(),
  timestamp: integer("timestamp", { mode: 'timestamp' }).notNull(),
  txType: text("tx_type", { enum: transactionDirectionEnum }).notNull(),
  status: text("status", { enum: transactionStatusEnum }).notNull().default('pending'),
  confirmations: integer("confirmations").default(0),
  categoryId: integer("category_id").references(() => categories.id),
  counterparty: text("counterparty"),
  exchangeRate: real("exchange_rate").notNull(), // BTC/USD rate at time of transaction
  memo: text("memo"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Categories table - For QuickBooks export
export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  name: text("name").notNull(),
  quickbooksAccount: text("quickbooks_account"),
  categoryType: text("category_type", { enum: categoryTypeEnum }).notNull(),
  isDefault: integer("is_default", { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Purchases table - Track Bitcoin purchases for cost basis (FIFO)
export const purchases = sqliteTable("purchases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  companyId: integer("company_id").notNull().references(() => companies.id),
  amountBtc: real("amount_btc").notNull(),
  costBasisUsd: real("cost_basis_usd").notNull(),
  purchaseDate: integer("purchase_date", { mode: 'timestamp' }).notNull(),
  remainingBtc: real("remaining_btc").notNull(), // For FIFO tracking
  source: text("source"), // Where the BTC came from
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Transaction lots table - Track which purchase lots were used for each transaction (for capital gains)
export const transactionLots = sqliteTable("transaction_lots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id").notNull().references(() => transactions.id),
  purchaseId: integer("purchase_id").notNull().references(() => purchases.id),
  btcAmountUsed: real("btc_amount_used").notNull(),
  costBasisUsed: real("cost_basis_used").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// Exchange rates table - Cache BTC/USD rates (don't hit API every time)
export const exchangeRates = sqliteTable("exchange_rates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  source: text("source").notNull().default('coingecko'),
  currency: text("currency").notNull().default('USD'),
  rate: real("rate").notNull(),
  timestamp: integer("timestamp", { mode: 'timestamp' }).notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().default(Date.now),
});

// ===========================
// RELATIONS
// ===========================

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  wallets: many(wallets),
  transactions: many(transactions),
  categories: many(categories),
  purchases: many(purchases),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  wallets: many(wallets),
  categories: many(categories),
  purchases: many(purchases),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [wallets.companyId],
    references: [companies.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  company: one(companies, {
    fields: [transactions.companyId],
    references: [companies.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  transactionLots: many(transactionLots),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [categories.companyId],
    references: [companies.id],
  }),
  transactions: many(transactions),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [purchases.companyId],
    references: [companies.id],
  }),
  transactionLots: many(transactionLots),
}));

export const transactionLotsRelations = relations(transactionLots, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionLots.transactionId],
    references: [transactions.id],
  }),
  purchase: one(purchases, {
    fields: [transactionLots.purchaseId],
    references: [purchases.id],
  }),
}));

// ===========================
// VALIDATION SCHEMAS
// ===========================

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

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
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionLotSchema = createInsertSchema(transactionLots).omit({
  id: true,
  createdAt: true,
});

export const insertExchangeRateSchema = createInsertSchema(exchangeRates).omit({
  id: true,
  createdAt: true,
});

// ===========================
// TYPES
// ===========================

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type TransactionLot = typeof transactionLots.$inferSelect;
export type InsertTransactionLot = z.infer<typeof insertTransactionLotSchema>;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
