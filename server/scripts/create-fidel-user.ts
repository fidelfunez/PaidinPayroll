import { db } from '../db.js';
import { users, companies } from '@shared/schema';
import { sql, eq } from 'drizzle-orm';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

async function createOrFixFidelUser() {
  console.log('🔧 Creating/Fixing Fidel User...');

  try {
    // Check if user exists (case-insensitive)
    const [existingUser] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER('fidel')`)
      .limit(1);

    // Ensure company ID 1 exists (PaidIn company)
    let paidInCompany;
    const [existingCompany] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, 1))
      .limit(1);

    if (!existingCompany) {
      console.log('⚠️ Company ID 1 does not exist. Creating PaidIn company...');
      [paidInCompany] = await db.insert(companies).values({
        name: 'PaidIn',
        slug: 'paidin',
        domain: null,
        logo: null,
        primaryColor: '#f97316',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      console.log('✅ PaidIn company created with ID:', paidInCompany.id);
    } else {
      paidInCompany = existingCompany;
      console.log('✅ PaidIn company found (ID: 1)');
    }

    const companyId = paidInCompany.id;
    const targetPassword = 'password123';
    const targetUsername = 'fidel';

    if (existingUser) {
      console.log(`✅ User "${existingUser.username}" found (ID: ${existingUser.id})`);
      
      // Check if password is correct
      const passwordValid = await comparePasswords(targetPassword, existingUser.password);
      
      if (passwordValid) {
        console.log('✅ Password is already correct!');
      } else {
        console.log('🔑 Password is incorrect. Updating password...');
        const hashedPassword = await hashPassword(targetPassword);
        
        await db
          .update(users)
          .set({
            password: hashedPassword,
            isActive: true,
            companyId: companyId, // Ensure correct company
          })
          .where(eq(users.id, existingUser.id));
        
        console.log('✅ Password updated successfully!');
      }

      // Ensure user is active, has correct company, and super_admin role
      if (!existingUser.isActive || existingUser.companyId !== companyId || existingUser.role !== 'super_admin') {
        console.log('🔧 Updating user status, company, and role to super_admin...');
        const updateData: any = {
          isActive: true,
          companyId: companyId,
        };
        
        if (existingUser.role !== 'super_admin') {
          updateData.role = 'super_admin';
          console.log('👑 Upgrading role to super_admin for full demo access');
        }
        
        await db
          .update(users)
          .set(updateData)
          .where(eq(users.id, existingUser.id));
        console.log('✅ User status, company, and role updated!');
      }

      // Get updated user info
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, existingUser.id))
        .limit(1);

      console.log('');
      console.log('📊 User Details:');
      console.log(`   - Username: ${updatedUser?.username || existingUser.username}`);
      console.log(`   - Email: ${updatedUser?.email || existingUser.email}`);
      console.log(`   - Role: ${updatedUser?.role || existingUser.role} (super_admin for full access)`);
      console.log(`   - Company ID: ${companyId}`);
      console.log(`   - Password: ${targetPassword}`);
      console.log(`   - Is Active: ${updatedUser?.isActive || existingUser.isActive}`);
      console.log('');
      console.log('🔐 Login Credentials:');
      console.log(`   - Username: ${targetUsername} (or ${updatedUser?.email || existingUser.email})`);
      console.log(`   - Password: ${targetPassword}`);
      
    } else {
      console.log('👤 User does not exist. Creating new user...');
      const hashedPassword = await hashPassword(targetPassword);
      
      const [newUser] = await db.insert(users).values({
        companyId: companyId,
        username: targetUsername,
        email: 'fidel@paidin.com',
        password: hashedPassword,
        role: 'super_admin', // Full access for Y Combinator demo
        firstName: 'Fidel',
        lastName: 'Funez',
        bio: 'PaidIn Founder - Y Combinator Demo Account',
        btcAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        withdrawalMethod: 'bitcoin',
        bankAccountDetails: null,
        monthlySalary: 10000,
        profilePhoto: null,
        isActive: true,
        createdAt: new Date(),
      }).returning();

      console.log('✅ User created successfully!');
      console.log('');
      console.log('📊 User Details:');
      console.log(`   - Username: ${newUser.username}`);
      console.log(`   - Email: ${newUser.email}`);
      console.log(`   - Role: ${newUser.role}`);
      console.log(`   - Company ID: ${newUser.companyId}`);
      console.log(`   - Password: ${targetPassword}`);
      console.log('');
      console.log('🔐 Login Credentials:');
      console.log(`   - Username: ${targetUsername} (or ${newUser.email})`);
      console.log(`   - Password: ${targetPassword}`);
    }

    console.log('');
    console.log('🎉 Fidel user is ready for Y Combinator demo!');
    console.log('✅ You can now login with:');
    console.log(`   - Username: ${targetUsername}`);
    console.log(`   - Password: ${targetPassword}`);

  } catch (error) {
    console.error('❌ Error creating/fixing Fidel user:', error);
    throw error;
  }
}

// Run the script
createOrFixFidelUser()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

