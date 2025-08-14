import { db } from '../db.js';
import { companies, users, payrollPayments, expenseReimbursements, btcpayInvoices, conversations, invoices, integrations, onboardingFlows } from '@shared/schema';
import { eq, isNull } from 'drizzle-orm';

async function migrateToMultiTenancy() {
  console.log('🚀 Starting safe migration to multi-tenancy...');

  try {
    // Step 1: Create the "PaidIn" company
    console.log('📝 Creating PaidIn company...');
    const [paidinCompany] = await db.insert(companies).values({
      name: 'PaidIn',
      slug: 'paidin',
      domain: null,
      logo: null,
      primaryColor: '#f97316',
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).returning();

    console.log('✅ PaidIn company created with ID:', paidinCompany.id);

    // Step 2: Update existing users to belong to PaidIn company
    console.log('👥 Updating existing users...');
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length > 0) {
      for (const user of existingUsers) {
        await db.update(users)
          .set({ companyId: paidinCompany.id })
          .where(eq(users.id, user.id));
      }
      console.log(`✅ Updated ${existingUsers.length} users to belong to PaidIn company`);
    } else {
      console.log('ℹ️ No existing users found');
    }

    // Step 3: Update other tables with company_id
    console.log('🔄 Updating other tables...');
    
    // Update payroll payments
    const payrollCount = await db.update(payrollPayments)
      .set({ companyId: paidinCompany.id })
      .where(isNull(payrollPayments.companyId));
    console.log('✅ Updated payroll payments');

    // Update expense reimbursements
    const expenseCount = await db.update(expenseReimbursements)
      .set({ companyId: paidinCompany.id })
      .where(isNull(expenseReimbursements.companyId));
    console.log('✅ Updated expense reimbursements');

    // Update BTCPay invoices
    const invoiceCount = await db.update(btcpayInvoices)
      .set({ companyId: paidinCompany.id })
      .where(isNull(btcpayInvoices.companyId));
    console.log('✅ Updated BTCPay invoices');

    // Update conversations
    const conversationCount = await db.update(conversations)
      .set({ companyId: paidinCompany.id })
      .where(isNull(conversations.companyId));
    console.log('✅ Updated conversations');

    // Update invoices
    const regularInvoiceCount = await db.update(invoices)
      .set({ companyId: paidinCompany.id })
      .where(isNull(invoices.companyId));
    console.log('✅ Updated invoices');

    // Update integrations
    const integrationCount = await db.update(integrations)
      .set({ companyId: paidinCompany.id })
      .where(isNull(integrations.companyId));
    console.log('✅ Updated integrations');

    // Update onboarding flows
    const onboardingCount = await db.update(onboardingFlows)
      .set({ companyId: paidinCompany.id })
      .where(isNull(onboardingFlows.companyId));
    console.log('✅ Updated onboarding flows');

    // Step 4: Create a super admin user for PaidIn
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
      createdAt: Date.now(),
    }).returning();

    console.log('✅ Super admin user created:', superAdmin.username);

    console.log('🎉 Multi-tenancy migration completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   - Company: ${paidinCompany.name} (ID: ${paidinCompany.id})`);
    console.log(`   - Users migrated: ${existingUsers.length}`);
    console.log(`   - Super admin: ${superAdmin.username}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the super admin password in production!');
    console.log('🔧 Next step: Run the database migration to add NOT NULL constraints');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateToMultiTenancy()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateToMultiTenancy };
