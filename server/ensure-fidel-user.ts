import { storage } from './storage.js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function ensureDemoUser() {
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
      });
      console.log('✅ Company created with ID:', company.id);
    } else {
      company = companies[0];
      console.log('✅ Found company:', company.name, '(ID:', company.id, ')');
    }

    // Check if demo user exists (for VCs, investors, and Y Combinator)
    const existingUser = await storage.getUserByUsername('demo');
    
    if (existingUser) {
      console.log('✅ Demo user already exists');
      
      // Always ensure password and company are correct
      const hashedPassword = await hashPassword('password123');
      await storage.updateUser(existingUser.id, {
        password: hashedPassword,
        companyId: company.id,
        isActive: true,
        role: 'super_admin',
        emailVerified: true, // Demo account doesn't need email verification
      });
      
      console.log('✅ Updated demo user (password: password123, companyId:', company.id, ', role: super_admin)');
    } else {
      console.log('👤 Creating demo user for investors/VCs...');
      const hashedPassword = await hashPassword('password123');
      
      const newUser = await storage.createUser({
        companyId: company.id,
        username: 'demo',
        email: 'demo@paidin.io',
        password: hashedPassword,
        role: 'super_admin',
        firstName: 'Demo',
        lastName: 'Account',
        bio: 'Demo account for investors, VCs, and Y Combinator testing',
        btcAddress: null,
        withdrawalMethod: 'not_set',
        bankAccountDetails: null,
        monthlySalary: null,
        profilePhoto: null,
        isActive: true,
        emailVerified: true, // Demo account doesn't need email verification
        createdAt: new Date(), // Explicit Date object for Drizzle timestamp mode
      });
      
      console.log('✅ Demo user created successfully!');
      console.log('   - ID:', newUser.id);
      console.log('   - Username: demo');
      console.log('   - Password: password123');
      console.log('   - Role: super_admin');
      console.log('   - Company ID:', newUser.companyId);
    }
    
    console.log('');
    console.log('🎉 Demo user setup complete!');
    console.log('📝 Login credentials for investors/VCs:');
    console.log('   - Username: demo');
    console.log('   - Password: password123');
    console.log('');
  } catch (error: any) {
    console.error('❌ Error ensuring demo user:', error);
    console.error('Error stack:', error?.stack);
    console.error('Error message:', error?.message);
    console.error('Error code:', error?.code);
    // Don't throw - allow server to start even if this fails
    // This is a convenience feature, not critical
    // But log extensively so we can debug
  }
}

