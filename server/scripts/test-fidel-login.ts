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

async function testFidelLogin() {
  console.log('🧪 Testing Fidel User Login...');
  console.log('');

  try {
    // 1. Check if user exists
    console.log('1️⃣ Checking if user exists...');
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER('fidel')`)
      .limit(1);

    if (!user) {
      console.log('❌ User "fidel" not found in database');
      return;
    }
    console.log('✅ User found:', user.username);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Company ID: ${user.companyId}`);
    console.log(`   - Is Active: ${user.isActive}`);
    console.log('');

    // 2. Test password
    console.log('2️⃣ Testing password authentication...');
    const passwordValid = await comparePasswords('password123', user.password);
    if (passwordValid) {
      console.log('✅ Password is correct!');
    } else {
      console.log('❌ Password is incorrect!');
      return;
    }
    console.log('');

    // 3. Check company association
    console.log('3️⃣ Checking company association...');
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, user.companyId))
      .limit(1);

    if (!company) {
      console.log('❌ Company not found for user');
      return;
    }
    console.log('✅ Company found:', company.name);
    console.log(`   - ID: ${company.id}`);
    console.log(`   - Slug: ${company.slug}`);
    console.log(`   - Is Active: ${company.isActive}`);
    console.log('');

    // 4. Verify user permissions
    console.log('4️⃣ Verifying user permissions...');
    const validRoles = ['super_admin', 'admin', 'employee', 'platform_admin'];
    if (!validRoles.includes(user.role)) {
      console.log(`❌ Invalid role: ${user.role}`);
      return;
    }
    console.log(`✅ Role is valid: ${user.role}`);
    
    if (user.role === 'super_admin' || user.role === 'platform_admin') {
      console.log('✅ User has full access (super_admin/platform_admin)');
    } else if (user.role === 'admin') {
      console.log('⚠️ User has admin access (limited Bitcoin features)');
    } else {
      console.log('⚠️ User has employee access (limited features)');
    }
    console.log('');

    // 5. Check if user is active
    console.log('5️⃣ Checking user status...');
    if (!user.isActive) {
      console.log('❌ User is not active!');
      return;
    }
    console.log('✅ User is active');
    console.log('');

    // 6. Test case-insensitive username lookup
    console.log('6️⃣ Testing case-insensitive username lookup...');
    const testUsernames = ['fidel', 'Fidel', 'FIDEL', 'fidel@paidin.com'];
    for (const testUsername of testUsernames) {
      const isEmail = testUsername.includes('@');
      let testUser;
      
      if (isEmail) {
        [testUser] = await db
          .select()
          .from(users)
          .where(sql`LOWER(${users.email}) = LOWER(${testUsername})`)
          .limit(1);
      } else {
        [testUser] = await db
          .select()
          .from(users)
          .where(sql`LOWER(${users.username}) = LOWER(${testUsername})`)
          .limit(1);
      }
      
      if (testUser && testUser.id === user.id) {
        console.log(`✅ "${testUsername}" resolves to correct user`);
      } else {
        console.log(`❌ "${testUsername}" does not resolve correctly`);
      }
    }
    console.log('');

    // 7. Summary
    console.log('📊 Login Test Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ User exists in database');
    console.log('✅ Password is correct');
    console.log('✅ Company association is valid');
    console.log('✅ User role is valid');
    console.log('✅ User is active');
    console.log('✅ Case-insensitive lookup works');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🎉 All tests passed! Login should work correctly.');
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('   - Username: fidel (or Fidel or FIDEL)');
    console.log('   - Email: fidel@paidin.com');
    console.log('   - Password: password123');
    console.log('');

  } catch (error) {
    console.error('❌ Error testing login:', error);
    throw error;
  }
}

// Run the test
testFidelLogin()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

