import { db } from '../db.js';
import { users, companies } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function fixPlatformAdmin() {
  console.log('🔧 Fixing Platform Admin Password...');

  try {
    // Delete existing platform admin
    console.log('🗑️ Deleting existing platform admin...');
    await db
      .delete(users)
      .where(eq(users.username, 'platform_admin'));

    // Get platform company
    const [platformCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, 'platform'))
      .limit(1);

    if (!platformCompany) {
      console.log('❌ Platform company not found');
      return;
    }

    // Create platform admin with correct password format
    console.log('👑 Creating platform admin with correct password format...');
    const hashedPassword = await hashPassword('PaidIn2024!');
    
    const [platformAdmin] = await db.insert(users).values({
      companyId: platformCompany.id,
      username: 'platform_admin',
      email: 'platform@paidin.com',
      password: hashedPassword,
      role: 'platform_admin',
      firstName: 'PaidIn',
      lastName: 'Admin',
      bio: 'Platform administrator for PaidIn - oversees all companies and users',
      btcAddress: null,
      withdrawalMethod: 'not_set',
      bankAccountDetails: null,
      monthlySalary: null,
      profilePhoto: null,
      isActive: true,
      createdAt: new Date(),
    }).returning();

    console.log('✅ Platform admin fixed successfully!');
    console.log('');
    console.log('📊 Platform Admin Details:');
    console.log(`   - Username: ${platformAdmin.username}`);
    console.log(`   - Email: ${platformAdmin.email}`);
    console.log(`   - Role: ${platformAdmin.role}`);
    console.log(`   - Company ID: ${platformAdmin.companyId} (Platform Level)`);
    console.log(`   - Password: PaidIn2024!`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('   - Username: platform_admin');
    console.log('   - Email: platform@paidin.com');
    console.log('   - Password: PaidIn2024!');
    console.log('');
    console.log('🎉 Platform admin password is now fixed and ready for login!');

  } catch (error) {
    console.error('❌ Error fixing platform admin:', error);
    throw error;
  }
}

// Run the script
fixPlatformAdmin()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
