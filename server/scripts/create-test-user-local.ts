/**
 * Script to create a test user for localhost development
 * Bypasses email verification - user is immediately verified and ready to use
 * Usage: npx tsx server/scripts/create-test-user-local.ts
 */

import { db } from '../db.js';
import { users, companies } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createTestUser() {
  try {
    console.log('👤 Creating test user for localhost...');

    // Check if test user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, 'test'))
      .limit(1);

    if (existingUser.length > 0) {
      console.log('✅ Test user already exists:');
      console.log(`   Username: ${existingUser[0].username}`);
      console.log(`   Email: ${existingUser[0].email}`);
      console.log(`   Password: test123`);
      console.log(`   Email Verified: ${existingUser[0].emailVerified}`);
      return;
    }

    // Create or get a test company
    let testCompany;
    const existingCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, 'test-company'))
      .limit(1);

    if (existingCompany.length > 0) {
      testCompany = existingCompany[0];
      console.log('✅ Using existing test company');
    } else {
      console.log('🏢 Creating test company...');
      [testCompany] = await db.insert(companies).values({
        name: 'Test Company',
        slug: 'test-company',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      console.log('✅ Test company created');
    }

    // Hash password
    const password = 'test123';
    const hashedPassword = await hashPassword(password);

    // Create test user (email verified, ready to use)
    console.log('👤 Creating test user...');
    const [testUser] = await db.insert(users).values({
      companyId: testCompany.id,
      username: 'test',
      email: 'test@test.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      emailVerified: true, // Skip email verification
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
      createdAt: new Date(),
    }).returning();

    console.log('');
    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('📊 Login Credentials:');
    console.log(`   Username: ${testUser.username}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Company: ${testCompany.name}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Email Verified: ${testUser.emailVerified ? 'Yes ✅' : 'No ❌'}`);
    console.log('');
    console.log('🌐 You can now log in at: http://localhost:5173/auth');
    console.log('');

  } catch (error: any) {
    console.error('❌ Error creating test user:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      if (error.message?.includes('username')) {
        console.error('   Username "test" already exists');
      } else if (error.message?.includes('email')) {
        console.error('   Email "test@test.com" already exists');
      }
    }
    process.exit(1);
  }
}

createTestUser()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
