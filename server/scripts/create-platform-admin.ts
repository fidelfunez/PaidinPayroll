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

async function createPlatformAdmin() {
  console.log('🚀 Creating PaidIn Platform Admin...');

  try {
    // Check if platform admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, 'platform_admin'))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('✅ Platform admin already exists:', existingAdmin[0].username);
      return;
    }

    // Create or get Platform company
    console.log('🏢 Creating Platform company...');
    let platformCompany;
    const existingPlatform = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, 'platform'))
      .limit(1);

    if (existingPlatform.length > 0) {
      platformCompany = existingPlatform[0];
      console.log('✅ Platform company already exists');
    } else {
      [platformCompany] = await db.insert(companies).values({
        name: 'PaidIn Platform',
        slug: 'platform',
        domain: null,
        logo: null,
        primaryColor: '#f97316',
        isActive: true,
        subscriptionPlan: 'enterprise',
        subscriptionStatus: 'active',
        maxEmployees: 999999,
        monthlyFee: 0,
        paymentStatus: 'current',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      console.log('✅ Platform company created');
    }

    // Create platform admin user
    console.log('👑 Creating platform admin user...');
    const hashedPassword = await hashPassword('PaidIn2024!');
    
    const [platformAdmin] = await db.insert(users).values({
      companyId: platformCompany.id, // Platform company
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

    console.log('✅ Platform admin created successfully!');
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
    console.log('🎉 Platform admin setup completed!');

  } catch (error) {
    console.error('❌ Error creating platform admin:', error);
    throw error;
  }
}

// Run the script
createPlatformAdmin()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
