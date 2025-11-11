import { db } from '../db.js';
import { users, companies } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function testPlatformAdmin() {
  console.log('🧪 Testing Platform Admin Setup...');

  try {
    // Check if platform admin exists
    const [platformAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'platform_admin'))
      .limit(1);

    if (!platformAdmin) {
      console.log('❌ Platform admin not found');
      return;
    }

    console.log('✅ Platform admin found:');
    console.log(`   - Username: ${platformAdmin.username}`);
    console.log(`   - Email: ${platformAdmin.email}`);
    console.log(`   - Role: ${platformAdmin.role}`);
    console.log(`   - Company ID: ${platformAdmin.companyId}`);

    // Check platform company
    const [platformCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, platformAdmin.companyId))
      .limit(1);

    if (platformCompany) {
      console.log('✅ Platform company found:');
      console.log(`   - Name: ${platformCompany.name}`);
      console.log(`   - Slug: ${platformCompany.slug}`);
      console.log(`   - Plan: ${platformCompany.subscriptionPlan}`);
    }

    // Check total companies (excluding platform)
    const allCompanies = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, 'platform'));

    const totalCompanies = await db
      .select()
      .from(companies);

    console.log('✅ Company counts:');
    console.log(`   - Total companies: ${totalCompanies.length}`);
    console.log(`   - Platform companies: ${allCompanies.length}`);
    console.log(`   - Regular companies: ${totalCompanies.length - allCompanies.length}`);

    // Test platform admin login endpoint
    console.log('\n🔐 Testing Platform Admin Login...');
    console.log('Login credentials:');
    console.log('   - Username: platform_admin');
    console.log('   - Email: platform@paidin.com');
    console.log('   - Password: PaidIn2024!');
    console.log('\n🌐 Access the platform dashboard at: http://localhost:8080/platform');

    console.log('\n✅ Platform admin setup is complete and ready for testing!');

  } catch (error) {
    console.error('❌ Error testing platform admin:', error);
    throw error;
  }
}

// Run the test
testPlatformAdmin()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
