import { storage } from './storage.js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function ensureFidelUser() {
  try {
    // Get or create company
    let companies = await storage.getCompanies();
    let company;
    
    if (!companies || companies.length === 0) {
      console.log('📝 Creating default PaidIn company...');
      company = await storage.createCompany({
        name: 'PaidIn',
        slug: 'paidin',
        domain: null,
        primaryColor: '#f97316',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✅ Company created with ID:', company.id);
    } else {
      company = companies[0];
      console.log('✅ Found company:', company.name, '(ID:', company.id, ')');
    }

    // Check if fidel user exists
    const existingUser = await storage.getUserByUsername('fidel');
    
    if (existingUser) {
      console.log('✅ User "fidel" already exists');
      
      // Always ensure password and company are correct
      const hashedPassword = await hashPassword('password123');
      await storage.updateUser(existingUser.id, {
        password: hashedPassword,
        companyId: company.id,
        isActive: true,
        role: 'super_admin',
      });
      
      console.log('✅ Updated fidel user (password: password123, companyId:', company.id, ', role: super_admin)');
    } else {
      console.log('👤 Creating fidel user...');
      const hashedPassword = await hashPassword('password123');
      
      const newUser = await storage.createUser({
        companyId: company.id,
        username: 'fidel',
        email: 'fidel@paidin.com',
        password: hashedPassword,
        role: 'super_admin',
        firstName: 'Fidel',
        lastName: 'Funez',
        bio: 'PaidIn Founder',
        btcAddress: null,
        withdrawalMethod: 'not_set',
        bankAccountDetails: null,
        monthlySalary: null,
        profilePhoto: null,
        isActive: true,
      });
      
      console.log('✅ User "fidel" created successfully!');
      console.log('   - ID:', newUser.id);
      console.log('   - Username: fidel');
      console.log('   - Password: password123');
      console.log('   - Role: super_admin');
      console.log('   - Company ID:', newUser.companyId);
    }
    
    console.log('');
    console.log('🎉 Fidel user setup complete!');
    console.log('📝 Login credentials:');
    console.log('   - Username: fidel');
    console.log('   - Password: password123');
    console.log('');
  } catch (error: any) {
    console.error('❌ Error ensuring fidel user:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    // Don't throw - allow server to start even if this fails
    // This is a convenience feature, not critical
    // But log extensively so we can debug
  }
}

