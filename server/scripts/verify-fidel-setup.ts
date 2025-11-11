import { db } from '../db.js';
import { users, companies } from '@shared/schema';
import { sql, eq } from 'drizzle-orm';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function verifyFidelSetup() {
  console.log('🔍 Comprehensive Fidel User Verification');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const issues: string[] = [];
  const successes: string[] = [];

  try {
    // 1. Database Connection
    console.log('1️⃣ Testing database connection...');
    try {
      await db.select().from(users).limit(1);
      successes.push('Database connection is working');
      console.log('✅ Database connection: OK');
    } catch (error: any) {
      issues.push(`Database connection failed: ${error.message}`);
      console.log('❌ Database connection: FAILED');
      console.log(`   Error: ${error.message}`);
    }
    console.log('');

    // 2. User Exists
    console.log('2️⃣ Checking if user exists...');
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER('fidel')`)
      .limit(1);

    if (!user) {
      issues.push('User "fidel" does not exist in database');
      console.log('❌ User not found');
      console.log('');
      console.log('💡 Run: npx tsx server/scripts/create-fidel-user.ts');
    } else {
      successes.push('User "fidel" exists in database');
      console.log('✅ User found:', user.username);
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - Company ID: ${user.companyId}`);
      console.log(`   - Is Active: ${user.isActive}`);
    }
    console.log('');

    if (user) {
      // 3. Password Verification
      console.log('3️⃣ Verifying password...');
      const passwordValid = await comparePasswords('password123', user.password);
      if (passwordValid) {
        successes.push('Password "password123" is correct');
        console.log('✅ Password is correct');
      } else {
        issues.push('Password "password123" is incorrect');
        console.log('❌ Password is incorrect');
        console.log('💡 Run: npx tsx server/scripts/create-fidel-user.ts');
      }
      console.log('');

      // 4. Company Association
      console.log('4️⃣ Verifying company association...');
      const [company] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, user.companyId))
        .limit(1);

      if (!company) {
        issues.push(`Company ID ${user.companyId} does not exist`);
        console.log('❌ Company not found');
      } else {
        successes.push(`Company "${company.name}" is associated with user`);
        console.log('✅ Company found:', company.name);
        console.log(`   - ID: ${company.id}`);
        console.log(`   - Slug: ${company.slug}`);
        console.log(`   - Is Active: ${company.isActive}`);
        
        if (!company.isActive) {
          issues.push('Company is not active');
          console.log('⚠️ Company is not active');
        }
      }
      console.log('');

      // 5. User Status
      console.log('5️⃣ Verifying user status...');
      if (!user.isActive) {
        issues.push('User is not active');
        console.log('❌ User is not active');
        console.log('💡 Run: npx tsx server/scripts/create-fidel-user.ts');
      } else {
        successes.push('User is active');
        console.log('✅ User is active');
      }
      console.log('');

      // 6. Role Verification
      console.log('6️⃣ Verifying user role...');
      const validRoles = ['super_admin', 'admin', 'employee', 'platform_admin'];
      if (!validRoles.includes(user.role)) {
        issues.push(`Invalid role: ${user.role}`);
        console.log(`❌ Invalid role: ${user.role}`);
      } else {
        successes.push(`Role is valid: ${user.role}`);
        console.log(`✅ Role is valid: ${user.role}`);
        
        if (user.role === 'super_admin' || user.role === 'platform_admin') {
          console.log('✅ User has full access (super_admin/platform_admin)');
        } else if (user.role === 'admin') {
          console.log('⚠️ User has admin access (limited Bitcoin features)');
        } else {
          console.log('⚠️ User has employee access (limited features)');
        }
      }
      console.log('');

      // 7. Case-Insensitive Lookup
      console.log('7️⃣ Testing case-insensitive lookup...');
      const testCases = [
        { input: 'fidel', type: 'username' },
        { input: 'Fidel', type: 'username' },
        { input: 'FIDEL', type: 'username' },
        { input: 'fidel@paidin.com', type: 'email' },
      ];

      let allCaseTestsPass = true;
      for (const testCase of testCases) {
        let testUser;
        if (testCase.type === 'email') {
          [testUser] = await db
            .select()
            .from(users)
            .where(sql`LOWER(${users.email}) = LOWER(${testCase.input})`)
            .limit(1);
        } else {
          [testUser] = await db
            .select()
            .from(users)
            .where(sql`LOWER(${users.username}) = LOWER(${testCase.input})`)
            .limit(1);
        }

        if (testUser && testUser.id === user.id) {
          console.log(`✅ "${testCase.input}" resolves correctly`);
        } else {
          allCaseTestsPass = false;
          console.log(`❌ "${testCase.input}" does not resolve correctly`);
        }
      }

      if (allCaseTestsPass) {
        successes.push('Case-insensitive lookup works correctly');
      } else {
        issues.push('Case-insensitive lookup has issues');
      }
      console.log('');
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 VERIFICATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    if (successes.length > 0) {
      console.log('✅ SUCCESSES:');
      successes.forEach(success => console.log(`   ✓ ${success}`));
      console.log('');
    }

    if (issues.length > 0) {
      console.log('❌ ISSUES FOUND:');
      issues.forEach(issue => console.log(`   ✗ ${issue}`));
      console.log('');
      console.log('💡 To fix issues, run:');
      console.log('   npx tsx server/scripts/create-fidel-user.ts');
      console.log('');
    }

    if (issues.length === 0) {
      console.log('🎉 All checks passed! Fidel user is ready for login.');
      console.log('');
      console.log('🔐 Login Credentials:');
      console.log('   - Username: fidel (case-insensitive)');
      console.log('   - Email: fidel@paidin.com');
      console.log('   - Password: password123');
      console.log('');
      console.log('📝 Next Steps:');
      console.log('   1. Start the server: npm run dev');
      console.log('   2. Test login at: http://localhost:8080');
      console.log('   3. Use credentials above to log in');
      console.log('');
    } else {
      console.log('⚠️ Please fix the issues above before testing login.');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Fatal error during verification:', error);
    throw error;
  }
}

// Run verification
verifyFidelSetup()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });

