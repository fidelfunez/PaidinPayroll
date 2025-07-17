import { db } from '../db.js';
import { users } from '@shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { eq } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createTestUser() {
  try {
    // Check if test user already exists
    const existingUser = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
    
    if (existingUser.length > 0) {
      console.log('Test user already exists');
      return;
    }

    // Create test user with correct password hashing
    const hashedPassword = await hashPassword('password123');
    
    await db.insert(users).values({
      username: 'admin',
      email: 'admin@paidin.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      monthlySalary: 8000,
      btcAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      password: hashedPassword,
      isActive: true,
      createdAt: new Date(),
    });

    console.log('✅ Test user created successfully!');
    console.log('Username: admin');
    console.log('Password: password123');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

createTestUser(); 