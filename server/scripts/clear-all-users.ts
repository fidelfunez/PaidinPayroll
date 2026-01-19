/**
 * Script to delete ALL users from the database
 * Usage: npx tsx server/scripts/clear-all-users.ts
 * 
 * WARNING: This will delete ALL users, including demo users and admin accounts!
 */

import { db } from '../db.js';
import { sqlite } from '../db.js';
import { users, companies, transactions, wallets, categories, purchases, transactionLots } from '../../shared/schema.js';
import { inArray, eq } from 'drizzle-orm';

async function clearAllUsers() {
  try {
    console.log('🔄 Starting user cleanup (ALL users will be deleted)...');

    // Get all users first
    const allUsers = await db.select({ id: users.id, username: users.username, email: users.email })
      .from(users);

    if (allUsers.length === 0) {
      console.log('✅ No users found in database');
      return;
    }

    console.log(`📝 Found ${allUsers.length} user(s) to delete:`);
    allUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.email})`);
    });

    const userIds = allUsers.map(u => u.id);

    // Temporarily disable foreign key constraints
    sqlite.exec('PRAGMA foreign_keys = OFF');
    console.log('⚠️  Foreign key constraints disabled temporarily');

    // Delete related records first
    console.log('🗑️  Deleting related records...');

    // Delete transactions
    const userWallets = await db.select({ id: wallets.id })
      .from(wallets)
      .where(inArray(wallets.userId, userIds));
    const walletIds = userWallets.map(w => w.id);
    
    if (walletIds.length > 0) {
      await db.delete(transactions)
        .where(inArray(transactions.walletId, walletIds));
      console.log('   ✅ Deleted transactions');
    }

    // Delete wallets
    if (walletIds.length > 0) {
      await db.delete(wallets)
        .where(inArray(wallets.userId, userIds));
      console.log('   ✅ Deleted wallets');
    }

    // Delete categories
    await db.delete(categories)
      .where(inArray(categories.userId, userIds));
    console.log('   ✅ Deleted categories');

    // Delete purchases
    await db.delete(purchases)
      .where(inArray(purchases.userId, userIds));
    console.log('   ✅ Deleted purchases');

    // Delete transaction lots
    if (walletIds.length > 0) {
      await db.delete(transactionLots)
        .where(inArray(transactionLots.transactionId, 
          await db.select({ id: transactions.id })
            .from(transactions)
            .where(inArray(transactions.walletId, walletIds))
        ));
      console.log('   ✅ Deleted transaction lots');
    }

    // Get company IDs from users
    const companyIds = [...new Set(allUsers.map(u => (u as any).companyId).filter(Boolean))];
    
    // Delete companies (they will be recreated on signup)
    if (companyIds.length > 0) {
      await db.delete(companies)
        .where(inArray(companies.id, companyIds));
      console.log('   ✅ Deleted companies');
    }

    // Delete the users
    await db.delete(users);
    console.log(`✅ Deleted ${allUsers.length} user(s)`);

    // Re-enable foreign key constraints
    sqlite.exec('PRAGMA foreign_keys = ON');
    console.log('✅ Foreign key constraints re-enabled');

    // Verify deletion
    const remainingUsers = await db.select().from(users);
    console.log(`\n📊 Remaining users: ${remainingUsers.length}`);
    
    if (remainingUsers.length > 0) {
      console.log('⚠️  Warning: Some users still exist:');
      remainingUsers.forEach(user => {
        console.log(`   - ${user.username} (${user.email})`);
      });
    }

    console.log('\n✅ All users cleared! You can now sign up fresh.');
  } catch (error: any) {
    // Always re-enable foreign key constraints even on error
    try {
      sqlite.exec('PRAGMA foreign_keys = ON');
    } catch {}
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run if called directly
clearAllUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

export { clearAllUsers };
