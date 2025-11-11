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

async function createRoleTestUsers() {
  console.log('🎭 Creating test users for all three roles...');
  
  try {
    const hashedPassword = await hashPassword('test123');
    
    // 1. Super Admin User
    console.log('👑 Creating Super Admin user...');
    const [superAdmin] = await db.insert(users).values({
      companyId: 1, // PaidIn company
      username: 'superadmin',
      email: 'superadmin@paidin.com',
      password: hashedPassword,
      role: 'super_admin',
      firstName: 'Super',
      lastName: 'Admin',
      bio: 'Super Administrator with Bitcoin access',
      btcAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      withdrawalMethod: 'bitcoin',
      bankAccountDetails: null,
      monthlySalary: 10000,
      profilePhoto: null,
      isActive: true,
      createdAt: new Date(),
    }).returning();
    
    console.log('✅ Super Admin created:', superAdmin.username);
    
    // 2. Regular Admin User
    console.log('👨‍💼 Creating Admin user...');
    const [admin] = await db.insert(users).values({
      companyId: 1, // PaidIn company
      username: 'admin',
      email: 'admin@paidin.com',
      password: hashedPassword,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      bio: 'Administrator with data access (no Bitcoin)',
      btcAddress: null,
      withdrawalMethod: 'not_set',
      bankAccountDetails: null,
      monthlySalary: 7500,
      profilePhoto: null,
      isActive: true,
      createdAt: new Date(),
    }).returning();
    
    console.log('✅ Admin created:', admin.username);
    
    // 3. Employee User
    console.log('👷‍♂️ Creating Employee user...');
    const [employee] = await db.insert(users).values({
      companyId: 1, // PaidIn company
      username: 'employee',
      email: 'employee@paidin.com',
      password: hashedPassword,
      role: 'employee',
      firstName: 'John',
      lastName: 'Employee',
      bio: 'Regular employee with limited access',
      btcAddress: 'bc1qemployee123456789abcdefghijklmnop',
      withdrawalMethod: 'bitcoin',
      bankAccountDetails: null,
      monthlySalary: 5000,
      profilePhoto: null,
      isActive: true,
      createdAt: new Date(),
    }).returning();
    
    console.log('✅ Employee created:', employee.username);
    
    console.log('\n🎉 All test users created successfully!');
    console.log('\n📋 Test User Credentials:');
    console.log('┌─────────────────┬─────────────────────┬─────────────────┬─────────────────┐');
    console.log('│ Role            │ Email               │ Username        │ Password        │');
    console.log('├─────────────────┼─────────────────────┼─────────────────┼─────────────────┤');
    console.log('│ Super Admin     │ superadmin@paidin.com │ superadmin      │ test123         │');
    console.log('│ Admin           │ admin@paidin.com    │ admin           │ test123         │');
    console.log('│ Employee        │ employee@paidin.com │ employee        │ test123         │');
    console.log('└─────────────────┴─────────────────────┴─────────────────┴─────────────────┘');
    
    console.log('\n🔍 What to test:');
    console.log('1. Login with each user and check navigation differences');
    console.log('2. Super Admin should see "Treasury Management" section');
    console.log('3. Admin should NOT see Bitcoin wallet access');
    console.log('4. Employee should see limited personal features only');
    console.log('5. Try accessing Super Admin pages with Admin/Employee accounts');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error);
  }
}

createRoleTestUsers();
