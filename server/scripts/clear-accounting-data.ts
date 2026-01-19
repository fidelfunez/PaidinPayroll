#!/usr/bin/env tsx
/**
 * Clear all accounting data from the database
 * This script removes:
 * - Transaction lots (cost basis tracking)
 * - Transactions
 * - Purchases
 * - Categories
 * - Wallets
 * - Exchange rates (optional)
 * 
 * Preserves:
 * - Users
 * - Companies
 * - Sessions (authentication)
 * 
 * Usage: tsx server/scripts/clear-accounting-data.ts
 */

import { db } from "../db.js";
import { transactionLots, transactions, purchases, categories, wallets, exchangeRates } from "@shared/schema";
import { sql } from "drizzle-orm";
import { sqlite } from "../db.js";

console.log("🧹 Starting cleanup of accounting data...\n");

try {
  // Use raw SQL to delete all records (drizzle delete requires where clause)
  const deleteInOrder = sqlite.transaction(() => {
    // Delete in order (respecting foreign key constraints)
    
    // 1. Transaction lots (references transactions)
    const lotsResult = sqlite.prepare(`DELETE FROM transaction_lots`).run();
    console.log(`✅ Deleted transaction lots: ${lotsResult.changes}`);

    // 2. Transactions (references wallets and categories)
    const txsResult = sqlite.prepare(`DELETE FROM transactions`).run();
    console.log(`✅ Deleted transactions: ${txsResult.changes}`);

    // 3. Purchases (standalone)
    const purchasesResult = sqlite.prepare(`DELETE FROM purchases`).run();
    console.log(`✅ Deleted purchases: ${purchasesResult.changes}`);

    // 4. Categories (standalone, but transactions reference them)
    const categoriesResult = sqlite.prepare(`DELETE FROM categories`).run();
    console.log(`✅ Deleted categories: ${categoriesResult.changes}`);

    // 5. Wallets (standalone, but transactions reference them)
    const walletsResult = sqlite.prepare(`DELETE FROM wallets`).run();
    console.log(`✅ Deleted wallets: ${walletsResult.changes}`);

    // 6. Exchange rates (optional - clears cache)
    const ratesResult = sqlite.prepare(`DELETE FROM exchange_rates`).run();
    console.log(`✅ Deleted exchange rates (cache): ${ratesResult.changes}`);
  });

  deleteInOrder();

  console.log("\n✨ Cleanup complete! All accounting data has been cleared.");
  console.log("👤 Your user account and company are preserved.");
  console.log("🚀 You can now test the complete flow from scratch.\n");

  process.exit(0);
} catch (error: any) {
  console.error("\n❌ Error during cleanup:", error.message);
  console.error(error);
  process.exit(1);
}
