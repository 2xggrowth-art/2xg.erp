import bcrypt from 'bcrypt';

/**
 * Script to generate bcrypt hashes for default users
 * Run this with: ts-node scripts/create-default-users.ts
 */

const defaultUsers = [
  {
    name: 'Zaheer',
    email: 'mohd.zaheer@gmail.com',
    password: 'admin123',
    role: 'Admin'
  },
  {
    name: 'Rahul Kumar',
    email: 'rahul@gmail.com',
    password: 'admin123',
    role: 'Manager'
  }
];

async function generateHashes() {
  console.log('Generating bcrypt hashes for default users...\n');

  for (const user of defaultUsers) {
    const hash = await bcrypt.hash(user.password, 10);
    console.log(`-- ${user.name} (${user.role})`);
    console.log(`INSERT INTO users (name, email, password_hash, role, status) VALUES`);
    console.log(`  ('${user.name}', '${user.email}', '${hash}', '${user.role}', 'Active')`);
    console.log(`ON CONFLICT (email) DO UPDATE`);
    console.log(`  SET password_hash = '${hash}', role = '${user.role}', status = 'Active';\n`);
  }

  console.log('\nCopy the SQL statements above and run them in your Supabase SQL Editor.');
}

generateHashes().catch(console.error);
