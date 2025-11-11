import 'dotenv/config';
import { db } from '../db.js';
import { users, companies } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function ensureFidelUser() {
  console.log('🔍 Checking for fidel user...');
  
  try {
    // Get or create company
    let [company] = await db.select().from(companies).limit(1);
    
    if (!company) {
      console.log('📝 Creating PaidIn company...');
      [company] = await db.insert(companies).values({
        name: 'PaidIn',
        slug: 'paidin',
        domain: null,
        logo: null,
        primaryColor: '#f97316',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      console.log('✅ Company created with ID:', company.id);
    } else {
      console.log('✅ Found company:', company.name, '(ID:', company.id, ')');
    }

    // Check if fidel user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, 'fidel'))
      .limit(1);

    if (existingUser) {
      console.log('✅ User "fidel" already exists');
      console.log('   - ID:', existingUser.id);
      console.log('   - Email:', existingUser.email);
      console.log('   - Role:', existingUser.role);
      console.log('   - Company ID:', existingUser.companyId);
      console.log('   - Is Active:', existingUser.isActive);
      
      // Update password and company if needed
      const hashedPassword = await hashPassword('password123');
      await db
        .update(users)
        .set({
          password: hashedPassword,
          companyId: company.id,
          isActive: true,
          role: 'super_admin',
        })
        .where(eq(users.id, existingUser.id));
      
      console.log('✅ Updated user password and company association');
      console.log('🔑 Password: password123');
    } else {
      console.log('👤 Creating fidel user...');
      const hashedPassword = await hashPassword('password123');
      
      const [newUser] = await db.insert(users).values({
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
        createdAt: new Date(),
      }).returning();
      
      console.log('✅ User "fidel" created successfully!');
      console.log('   - ID:', newUser.id);
      console.log('   - Username: fidel');
      console.log('   - Email: fidel@paidin.com');
      console.log('   - Password: password123');
      console.log('   - Role: super_admin');
      console.log('   - Company ID:', newUser.companyId);
    }
    
    console.log('');
    console.log('🎉 Setup complete!');
    console.log('📝 Login credentials:');
    console.log('   - Username: fidel');
    console.log('   - Password: password123');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

ensureFidelUser()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

