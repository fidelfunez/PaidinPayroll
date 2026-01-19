import { db } from '../db.js';
import { users } from '../../shared/schema.js';

async function listUsers() {
  const allUsers = await db.select({
    id: users.id,
    username: users.username,
    email: users.email,
    role: users.role,
  }).from(users);
  
  console.log('Current users:');
  if (allUsers.length === 0) {
    console.log('  (no users found)');
  } else {
    allUsers.forEach(u => {
      console.log(`  - ${u.username} (${u.email}) - role: ${u.role}`);
    });
  }
  process.exit(0);
}

listUsers();
