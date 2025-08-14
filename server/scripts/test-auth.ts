import { db } from '../db.js';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function testAuth() {
  console.log('🔍 Testing authentication...');
  
  try {
    // Get user from database
    const [user] = await db.select().from(users).where(eq(users.username, 'fidel'));
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.username);
    console.log('📧 Email:', user.email);
    console.log('🏢 Company ID:', user.companyId);
    console.log('🔑 Password hash length:', user.password.length);
    
    // Test password comparison
    const testPassword = 'password123';
    const isValid = await comparePasswords(testPassword, user.password);
    
    console.log('🔐 Password valid:', isValid);
    
    if (isValid) {
      console.log('🎉 Authentication would succeed!');
    } else {
      console.log('❌ Authentication would fail');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAuth();
