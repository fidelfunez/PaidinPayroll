import { db } from '../db.js';
import { users } from '@shared/schema';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function testLogin() {
  console.log('🔍 Testing login for superadmin user...');
  
  try {
    // Get the superadmin user
    const [user] = await db.select().from(users).where(eq(users.username, 'superadmin'));
    
    if (!user) {
      console.log('❌ Superadmin user not found!');
      return;
    }
    
    console.log('✅ Superadmin user found:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    });
    
    // Test password comparison
    const testPassword = 'test123';
    const isPasswordValid = await comparePasswords(testPassword, user.password);
    
    console.log('🔑 Password test result:', isPasswordValid ? '✅ VALID' : '❌ INVALID');
    
    if (!isPasswordValid) {
      console.log('🔧 Creating new password hash...');
      const newHash = await hashPassword(testPassword);
      
      // Update the user's password
      await db.update(users)
        .set({ password: newHash })
        .where(eq(users.id, user.id));
      
      console.log('✅ Password updated successfully!');
      
      // Test again
      const isPasswordValidAfterUpdate = await comparePasswords(testPassword, newHash);
      console.log('🔑 Password test after update:', isPasswordValidAfterUpdate ? '✅ VALID' : '❌ INVALID');
    }
    
  } catch (error) {
    console.error('❌ Error testing login:', error);
  }
}

testLogin();
