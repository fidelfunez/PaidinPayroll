import { db } from '../db.js';
import { users } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function testEmailLogin() {
  console.log('🔍 Testing email login functionality...');
  
  try {
    // Test direct email lookup
    console.log('📧 Testing direct email lookup...');
    const [userByEmail] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER('superadmin@paidin.com')`);
    console.log('User found by email:', userByEmail ? `${userByEmail.username} (${userByEmail.email})` : 'Not found');
    
    // Test username lookup
    console.log('👤 Testing username lookup...');
    const [userByUsername] = await db.select().from(users).where(sql`LOWER(${users.username}) = LOWER('superadmin')`);
    console.log('User found by username:', userByUsername ? `${userByUsername.username} (${userByUsername.email})` : 'Not found');
    
    // Test our new function logic
    console.log('🔧 Testing getUserByUsernameOrEmail logic...');
    const loginField = 'superadmin@paidin.com';
    const isEmail = loginField.includes('@');
    console.log('Is email?', isEmail);
    
    if (isEmail) {
      const [user] = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${loginField})`);
      console.log('Result from email lookup:', user ? `${user.username} (${user.email})` : 'Not found');
    } else {
      const [user] = await db.select().from(users).where(sql`LOWER(${users.username}) = LOWER(${loginField})`);
      console.log('Result from username lookup:', user ? `${user.username} (${user.email})` : 'Not found');
    }
    
  } catch (error) {
    console.error('❌ Error testing email login:', error);
  }
}

testEmailLogin();
