import { db } from '../db.js';
import { companies, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function setupMultiTenancy() {
  console.log('🚀 Setting up multi-tenancy...');

  try {
    // 1. Create the "PaidIn" company
    console.log('📝 Creating PaidIn company...');
    const [paidinCompany] = await db.insert(companies).values({
      name: 'PaidIn',
      slug: 'paidin',
      domain: null,
      logo: null,
      primaryColor: '#f97316',
      isActive: true,
    }).returning();

    console.log('✅ PaidIn company created with ID:', paidinCompany.id);

    // 2. Update existing users to belong to PaidIn company
    console.log('👥 Updating existing users...');
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length > 0) {
      await db.update(users)
        .set({ companyId: paidinCompany.id })
        .where(eq(users.companyId, 0)); // Update users without company_id

      console.log(`✅ Updated ${existingUsers.length} users to belong to PaidIn company`);
    } else {
      console.log('ℹ️ No existing users found');
    }

    // 3. Create a super admin user for PaidIn
    console.log('👑 Creating super admin user...');
    const [superAdmin] = await db.insert(users).values({
      companyId: paidinCompany.id,
      username: 'admin',
      email: 'admin@paidin.com',
      password: '$2b$10$rQZ8K9mN2pL1vX3yW4zA5uB6cD7eF8gH9iJ0kL1mN2oP3qR4sT5uV6wX7yZ8', // "admin123" - change this!
      role: 'super_admin',
      firstName: 'Super',
      lastName: 'Admin',
      bio: 'System administrator for PaidIn',
      btcAddress: null,
      withdrawalMethod: 'not_set',
      bankAccountDetails: null,
      monthlySalary: null,
      profilePhoto: null,
      isActive: true,
    }).returning();

    console.log('✅ Super admin user created:', superAdmin.username);

    console.log('🎉 Multi-tenancy setup completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Company: ${paidinCompany.name} (ID: ${paidinCompany.id})`);
    console.log(`   - Users migrated: ${existingUsers.length}`);
    console.log(`   - Super admin: ${superAdmin.username}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the super admin password in production!');

  } catch (error) {
    console.error('❌ Error setting up multi-tenancy:', error);
    throw error;
  }
}

// Run the setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupMultiTenancy()
    .then(() => {
      console.log('✅ Setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

export { setupMultiTenancy };
