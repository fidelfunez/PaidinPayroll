/**
 * Script to make a user a platform admin
 * Usage: npx tsx server/scripts/make-user-platform-admin.ts <username-or-email>
 * 
 * Example:
 *   npx tsx server/scripts/make-user-platform-admin.ts fidel@paidin.io
 */

import { db } from '../db.js';
import { users } from '../../shared/schema.js';
import { eq, or } from 'drizzle-orm';

async function makeUserPlatformAdmin(identifier: string) {
  try {
    console.log(`🔍 Looking for user: ${identifier}...`);

    // Find user by username or email
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.username, identifier),
          eq(users.email, identifier)
        )
      )
      .limit(1);

    if (!user) {
      console.error(`❌ User not found: ${identifier}`);
      console.log('💡 Available users:');
      const allUsers = await db.select({
        username: users.username,
        email: users.email,
        role: users.role,
      }).from(users);
      allUsers.forEach(u => {
        console.log(`   - ${u.username} (${u.email}) - role: ${u.role}`);
      });
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.username} (${user.email})`);
    console.log(`   Current role: ${user.role}`);

    if (user.role === 'platform_admin') {
      console.log('✅ User is already a platform admin!');
      return;
    }

    // Update user to platform_admin
    await db
      .update(users)
      .set({ role: 'platform_admin' as any }) // Type assertion needed since enum doesn't include platform_admin yet
      .where(eq(users.id, user.id));

    console.log(`✅ Updated ${user.username} to platform_admin role`);
    console.log('');
    console.log('🎉 User can now access the admin console!');
    console.log('   - Admin Console link will appear in sidebar');
    console.log('   - Can access /admin route');
    console.log('   - Can manage all users on the platform');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get identifier from command line
const identifier = process.argv[2];

if (!identifier) {
  console.error('❌ Please provide a username or email');
  console.log('');
  console.log('Usage: npx tsx server/scripts/make-user-platform-admin.ts <username-or-email>');
  console.log('');
  console.log('Example:');
  console.log('  npx tsx server/scripts/make-user-platform-admin.ts fidel@paidin.io');
  console.log('  npx tsx server/scripts/make-user-platform-admin.ts fidel');
  process.exit(1);
}

makeUserPlatformAdmin(identifier)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
