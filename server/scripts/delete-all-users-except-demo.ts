/**
 * Script to delete all users except the demo account
 * Usage: npx tsx server/scripts/delete-all-users-except-demo.ts
 */

import { db } from '../db.js';
import { sqlite } from '../db.js';
import { users, companies, breezWallets } from '../../shared/schema.js';
import { eq, and, ne, inArray } from 'drizzle-orm';

async function deleteAllUsersExceptDemo() {
  try {
    console.log('🔄 Starting user cleanup...');

    // Temporarily disable foreign key constraints
    sqlite.exec('PRAGMA foreign_keys = OFF');
    console.log('⚠️  Foreign key constraints disabled temporarily');

    // Find the demo user
    const [demoUser] = await db.select()
      .from(users)
      .where(eq(users.username, 'demo'))
      .limit(1);

    if (!demoUser) {
      console.log('⚠️  Demo user not found. Creating it first...');
      // Demo user will be created on next server restart by ensure-demo-user.ts
      console.log('✅ Demo user will be created on server restart');
    } else {
      console.log(`✅ Found demo user: ${demoUser.email} (ID: ${demoUser.id})`);
    }

    // Get all user IDs except demo
    const usersToDelete = await db.select({ id: users.id })
      .from(users)
      .where(ne(users.username, 'demo'));

    if (usersToDelete.length === 0) {
      console.log('✅ No users to delete (only demo user exists)');
    } else {
      const userIdsToDelete = usersToDelete.map(u => u.id);
      console.log(`📝 Found ${userIdsToDelete.length} users to delete (excluding demo)`);

      // Delete related records first (foreign key constraints)
      console.log('🗑️  Deleting related records...');

      // Delete breez wallets for these users
      if (userIdsToDelete.length > 0) {
        await db.delete(breezWallets)
          .where(inArray(breezWallets.userId, userIdsToDelete));
        console.log('   ✅ Deleted associated wallets');
      }

      // Delete the users
      await db.delete(users)
        .where(ne(users.username, 'demo'));
      console.log(`✅ Deleted ${userIdsToDelete.length} users`);
    }

    // List remaining users
    const remainingUsers = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
    }).from(users);

    console.log(`\n📊 Remaining users (${remainingUsers.length}):`);
    remainingUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.email})`);
    });

    // Re-enable foreign key constraints
    sqlite.exec('PRAGMA foreign_keys = ON');
    console.log('✅ Foreign key constraints re-enabled');

    console.log('\n✅ User cleanup complete!');
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
deleteAllUsersExceptDemo()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

export { deleteAllUsersExceptDemo };
