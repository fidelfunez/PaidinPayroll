import { db } from '../db.js';
import { users } from '@shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createTestUser() {
  console.log('👤 Creating test user...');
  
  try {
    const hashedPassword = await hashPassword('test123');
    
    const [newUser] = await db.insert(users).values({
      companyId: 1, // PaidIn company
      username: 'testuser3',
      email: 'test3@paidin.com',
      password: hashedPassword,
      role: 'admin',
      firstName: 'Test',
      lastName: 'User',
      bio: 'Test user for authentication',
      btcAddress: null,
      withdrawalMethod: 'not_set',
      bankAccountDetails: null,
      monthlySalary: null,
      profilePhoto: null,
      isActive: true,
      createdAt: new Date(),
    }).returning();
    
    console.log('✅ Test user created:', newUser.username);
    console.log('🔑 Password: test123');
    console.log('🏢 Company ID:', newUser.companyId);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestUser();
