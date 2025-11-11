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

async function verifyLogin() {
  console.log('🔍 Verifying Fidel user login...');
  console.log('');
  
  try {
    // Check user exists
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER('fidel')`)
      .limit(1);
    
    if (!user) {
      console.log('❌ User "fidel" not found');
      process.exit(1);
    }
    
    console.log('✅ User found:');
    console.log(`   - Username: ${user.username}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Is Active: ${user.isActive}`);
    console.log(`   - Company ID: ${user.companyId}`);
    console.log('');
    
    // Check company exists
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, user.companyId))
      .limit(1);
    
    if (!company) {
      console.log('❌ Company not found for user');
      process.exit(1);
    }
    
    console.log('✅ Company found:');
    console.log(`   - Name: ${company.name}`);
    console.log(`   - Is Active: ${company.isActive}`);
    console.log('');
    
    // Test password
    const passwordValid = await comparePasswords('password123', user.password);
    
    if (!passwordValid) {
      console.log('❌ Password "password123" is INCORRECT');
      console.log('');
      console.log('⚠️  The password hash in the database does not match "password123"');
      console.log('   You may need to reset the password.');
      process.exit(1);
    }
    
    console.log('✅ Password "password123" is CORRECT');
    console.log('');
    
    // Final check
    if (user.isActive && company.isActive && passwordValid) {
      console.log('🎉 LOGIN VERIFICATION PASSED!');
      console.log('');
      console.log('✅ You can login with:');
      console.log('   - Username: fidel');
      console.log('   - Password: password123');
      console.log('');
      process.exit(0);
    } else {
      console.log('❌ LOGIN VERIFICATION FAILED');
      console.log('');
      if (!user.isActive) console.log('   - User is not active');
      if (!company.isActive) console.log('   - Company is not active');
      if (!passwordValid) console.log('   - Password is incorrect');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyLogin();

