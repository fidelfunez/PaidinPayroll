import { db } from '../db.js';
import { companies, users } from '@shared/schema';
import { eq } from 'drizzle-orm';

console.log('🚀 Starting simple migration...');

async function simpleMigration() {
  try {
    console.log('📝 Creating PaidIn company...');
    
    const [paidinCompany] = await db.insert(companies).values({
      name: 'PaidIn',
      slug: 'paidin',
      domain: null,
      logo: null,
      primaryColor: '#f97316',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    console.log('✅ PaidIn company created with ID:', paidinCompany.id);

    // Update existing users
    const existingUsers = await db.select().from(users);
    console.log('Found users:', existingUsers.length);

    for (const user of existingUsers) {
      await db.update(users)
        .set({ companyId: paidinCompany.id })
        .where(eq(users.id, user.id));
      console.log(`Updated user ${user.username}`);
    }

    console.log('🎉 Migration completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

simpleMigration();
