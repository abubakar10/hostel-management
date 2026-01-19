// Setup script to create .env file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log('📝 PostgreSQL Database Configuration Setup\n');
  console.log('Please provide your PostgreSQL connection details:');
  console.log('(Press Enter to use default values)\n');

  const dbUser = await question('Database User [postgres]: ') || 'postgres';
  const dbPassword = await question('Database Password: ');
  const dbHost = await question('Database Host [localhost]: ') || 'localhost';
  const dbName = await question('Database Name [hostel_management]: ') || 'hostel_management';
  const dbPort = await question('Database Port [5432]: ') || '5432';
  const jwtSecret = await question('JWT Secret (press Enter for random): ') || 
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const envContent = `PORT=5000
DB_USER=${dbUser}
DB_HOST=${dbHost}
DB_NAME=${dbName}
DB_PASSWORD=${dbPassword}
DB_PORT=${dbPort}
JWT_SECRET=${jwtSecret}
JWT_EXPIRE=7d
`;

  const envPath = path.join(__dirname, '.env');
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    console.log(`📁 Location: ${envPath}\n`);
    console.log('⚠️  Important: Make sure:');
    console.log('   1. PostgreSQL is running');
    console.log('   2. Database "' + dbName + '" exists');
    console.log('   3. User "' + dbUser + '" has access to the database');
    console.log('\nNext steps:');
    console.log('   1. Create database: CREATE DATABASE ' + dbName + ';');
    console.log('   2. Run schema: psql -U ' + dbUser + ' -d ' + dbName + ' -f database/schema.sql');
    console.log('   3. Run seed: node database/seed.js\n');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }

  rl.close();
}

setup();

