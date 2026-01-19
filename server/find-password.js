// Try to find the correct PostgreSQL password
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const commonPasswords = [
  'postgres',
  'admin',
  'root',
  '',
  'password',
  '123456',
  'postgresql',
  'PostgreSQL',
  'POSTGRES'
];

async function tryPassword(password) {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: password,
    port: process.env.DB_PORT || 5432,
  });

  try {
    await pool.query('SELECT 1');
    await pool.end();
    return true;
  } catch (error) {
    await pool.end();
    return false;
  }
}

async function findPassword() {
  console.log('🔍 Trying to find your PostgreSQL password...\n');
  console.log('This will try common passwords. If none work, you\'ll need to reset it.\n');

  for (const password of commonPasswords) {
    const displayPassword = password === '' ? '(empty)' : password;
    process.stdout.write(`Trying: ${displayPassword}... `);
    
    const success = await tryPassword(password);
    
    if (success) {
      console.log('✅ SUCCESS!\n');
      console.log(`Your PostgreSQL password is: "${password === '' ? '(empty - no password)' : password}"\n`);
      console.log('📝 Update your server/.env file:');
      console.log(`   DB_PASSWORD=${password === '' ? '' : password}\n`);
      
      // Update .env file if possible
      try {
        const fs = await import('fs');
        const envPath = './.env';
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${password}`);
        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env file updated automatically!\n');
      } catch (err) {
        console.log('⚠️  Could not auto-update .env file. Please update it manually.\n');
      }
      
      return password;
    } else {
      console.log('❌');
    }
  }

  console.log('\n❌ None of the common passwords worked.\n');
  console.log('💡 You need to reset your PostgreSQL password.');
  console.log('\n📖 Instructions:');
  console.log('1. Open pgAdmin (if installed)');
  console.log('2. Or use the password reset method in QUICK_FIX.md');
  console.log('3. Or check if you set a password during PostgreSQL installation\n');
  
  return null;
}

findPassword();

