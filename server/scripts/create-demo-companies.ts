import { db } from '../db.js';
import { companies, users } from '@shared/schema';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createDemoCompanies() {
  console.log('🏢 Creating demo companies...');
  
  try {
    // Create Acme Corp
    const [acmeCompany] = await db.insert(companies).values({
      name: 'Acme Corporation',
      slug: 'acme-corp',
      domain: 'acmecorp.com',
      logo: null,
      primaryColor: '#3b82f6', // Blue
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log('✅ Acme Corp created:', acmeCompany.name);

    // Create TechStart Inc
    const [techStartCompany] = await db.insert(companies).values({
      name: 'TechStart Inc',
      slug: 'techstart',
      domain: 'techstart.io',
      logo: null,
      primaryColor: '#10b981', // Green
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    console.log('✅ TechStart Inc created:', techStartCompany.name);

    // Create users for each company
    const acmePassword = await hashPassword('acme123');
    const [acmeUser] = await db.insert(users).values({
      companyId: acmeCompany.id,
      username: 'john.acme',
      email: 'john@acmecorp.com',
      password: acmePassword,
      role: 'admin',
      firstName: 'John',
      lastName: 'Smith',
      bio: 'Acme Corp Admin',
      btcAddress: null,
      withdrawalMethod: 'not_set',
      bankAccountDetails: null,
      monthlySalary: null,
      profilePhoto: null,
      isActive: true,
      createdAt: new Date(),
    }).returning();
    
    console.log('✅ Acme user created:', acmeUser.username, '(password: acme123)');

    const techStartPassword = await hashPassword('tech123');
    const [techStartUser] = await db.insert(users).values({
      companyId: techStartCompany.id,
      username: 'sarah.tech',
      email: 'sarah@techstart.io',
      password: techStartPassword,
      role: 'admin',
      firstName: 'Sarah',
      lastName: 'Johnson',
      bio: 'TechStart Admin',
      btcAddress: null,
      withdrawalMethod: 'not_set',
      bankAccountDetails: null,
      monthlySalary: null,
      profilePhoto: null,
      isActive: true,
      createdAt: new Date(),
    }).returning();
    
    console.log('✅ TechStart user created:', techStartUser.username, '(password: tech123)');

    console.log('🎉 Demo companies setup complete!');
    console.log('');
    console.log('📧 Test these email domains:');
    console.log('   - john@acmecorp.com → Acme Corporation');
    console.log('   - sarah@techstart.io → TechStart Inc');
    console.log('   - test3@paidin.com → PaidIn (existing)');
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('   - Acme: john.acme / acme123');
    console.log('   - TechStart: sarah.tech / tech123');
    console.log('   - PaidIn: testuser3 / test123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createDemoCompanies();
