#!/usr/bin/env tsx
/**
 * Clear all wallets and transactions for a specific user/company
 * This script removes:
 * - Transaction lots (cost basis tracking)
 * - Transactions
 * - Purchases
 * - Categories (user-specific)
 * - Wallets
 * 
 * Preserves:
 * - Users
 * - Companies
 * - Exchange rates (cache)
 * - Sessions (authentication)
 * 
 * Usage: tsx server/scripts/clear-user-wallets.ts [companyId]
 * If companyId is not provided, it will delete for ALL companies (use with caution!)
 */

import { db } from "../db.js";
import { transactionLots, transactions, purchases, categories, wallets } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import { sqlite } from "../db.js";

// Safety check: Only allow in development
if (process.env.NODE_ENV === 'production') {
  console.error("❌ ERROR: This script cannot be run in production!");
  console.error("   This is a development/testing script only.");
  process.exit(1);
}

const companyIdArg = process.argv[2];
const companyId = companyIdArg ? parseInt(companyIdArg) : null;

console.log("🧹 Starting cleanup of wallets and transactions...\n");
console.log("⚠️  This script will DELETE all wallets and transactions for the specified company!\n");

if (!companyId) {
  console.log("⚠️  WARNING: No companyId provided. This will delete ALL wallets and transactions for ALL companies!");
  console.log("   Usage: tsx server/scripts/clear-user-wallets.ts [companyId]\n");
  process.exit(1);
}

try {
  console.log(`📊 Deleting data for company ID: ${companyId}\n`);

  // Get all wallets for this company
  const companyWallets = await db
    .select({ id: wallets.id })
    .from(wallets)
    .where(eq(wallets.companyId, companyId));
  
  const walletIds = companyWallets.map(w => w.id);
  console.log(`📦 Found ${walletIds.length} wallet(s) to delete`);

  // Delete in order (respecting foreign key constraints)
  
  // 1. Transaction lots (references transactions)
  if (walletIds.length > 0) {
    const transactionsForWallets = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(inArray(transactions.walletId, walletIds));
    
    const transactionIds = transactionsForWallets.map(t => t.id);
    
    if (transactionIds.length > 0) {
      await db.delete(transactionLots)
        .where(inArray(transactionLots.transactionId, transactionIds));
      console.log(`✅ Deleted transaction lots`);
    }
  }

  // 2. Transactions (references wallets)
  if (walletIds.length > 0) {
    const txsResult = await db.delete(transactions)
      .where(inArray(transactions.walletId, walletIds));
    console.log(`✅ Deleted transactions: ${txsResult.changes || 0}`);
  }

  // 3. Purchases (filtered by company)
  const purchasesResult = await db.delete(purchases)
    .where(eq(purchases.companyId, companyId));
  console.log(`✅ Deleted purchases: ${purchasesResult.changes || 0}`);

  // 4. Categories (filtered by company)
  const categoriesResult = await db.delete(categories)
    .where(eq(categories.companyId, companyId));
  console.log(`✅ Deleted categories: ${categoriesResult.changes || 0}`);

  // 5. Wallets (filtered by company)
  const walletsResult = await db.delete(wallets)
    .where(eq(wallets.companyId, companyId));
  console.log(`✅ Deleted wallets: ${walletsResult.changes || 0}`);

  console.log("\n✨ Cleanup complete! All wallets and transactions have been cleared.");
  console.log("👤 Your user account and company are preserved.");
  console.log("🚀 You can now test the complete flow from scratch.\n");

  process.exit(0);
} catch (error: any) {
  console.error("\n❌ Error during cleanup:", error.message);
  console.error(error);
  process.exit(1);
}
