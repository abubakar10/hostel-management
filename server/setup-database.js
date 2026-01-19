// Setup database with proper schema loading
import pkg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool, Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
  console.log('🔍 Setting up PostgreSQL database...\n');
  console.log(`Connecting with:`);
  console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Port: ${process.env.DB_PORT || 5432}\n`);

  try {
    // Step 1: Connect to postgres database
    const adminPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Test connection
    await adminPool.query('SELECT version()');
    console.log('✅ Connected to PostgreSQL!\n');

    // Step 2: Create database if it doesn't exist
    const dbCheck = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'hostel_management'"
    );

    if (dbCheck.rows.length === 0) {
      console.log('📦 Creating database "hostel_management"...');
      await adminPool.query('CREATE DATABASE hostel_management');
      console.log('✅ Database created!\n');
    } else {
      console.log('✅ Database "hostel_management" already exists\n');
    }

    await adminPool.end();

    // Step 3: Connect to hostel_management and run schema
    const appClient = new Client({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'hostel_management',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    await appClient.connect();
    console.log('📋 Loading database schema...');

    // Read and execute schema file
    const schemaPath = join(__dirname, 'database', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    // Execute the entire schema as one query
    // Split by semicolons but keep CREATE TABLE blocks together
    const statements = schema
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      if (statement.trim() && !statement.toLowerCase().includes('on conflict')) {
        try {
          await appClient.query(statement);
        } catch (err) {
          // Ignore "already exists" errors
          if (!err.message.includes('already exists') && 
              !err.message.includes('duplicate') &&
              !err.message.includes('does not exist')) {
            console.warn(`Warning: ${err.message.substring(0, 100)}`);
          }
        }
      }
    }

    console.log('✅ Schema loaded!\n');

    // Step 4: Check if admin user exists
    const userCheck = await appClient.query("SELECT * FROM users WHERE username = 'admin'");
    
    if (userCheck.rows.length === 0) {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await appClient.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
        ['admin', 'admin@hostel.com', hashedPassword, 'admin']
      );
      console.log('✅ Admin user created!');
      console.log('   Username: admin');
      console.log('   Password: admin123\n');
    } else {
      console.log('✅ Admin user already exists\n');
    }

    await appClient.end();

    console.log('🎉 Database setup complete!\n');
    console.log('You can now start your server with: npm run dev\n');

  } catch (error) {
    console.error('\n❌ Setup failed!\n');
    console.error('Error:', error.message);
    console.error('\n💡 Make sure:');
    console.error('1. PostgreSQL is running');
    console.error('2. Password in server/.env is correct');
    console.error('3. User has permission to create databases');
    process.exit(1);
  }
}

setupDatabase();

