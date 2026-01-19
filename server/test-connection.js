// Test PostgreSQL connection and setup database
import pkg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

dotenv.config();

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'postgres', // Connect to default postgres database first
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...\n');
  console.log(`Connecting with:`);
  console.log(`  User: ${process.env.DB_USER || 'postgres'}`);
  console.log(`  Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`  Port: ${process.env.DB_PORT || 5432}\n`);

  try {
    // Test connection
    const result = await pool.query('SELECT version()');
    console.log('✅ Connection successful!\n');
    console.log('PostgreSQL version:', result.rows[0].version.split(',')[0], '\n');

    // Check if database exists
    const dbCheck = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'hostel_management'"
    );

    if (dbCheck.rows.length === 0) {
      console.log('📦 Creating database "hostel_management"...');
      await pool.query('CREATE DATABASE hostel_management');
      console.log('✅ Database created!\n');
    } else {
      console.log('✅ Database "hostel_management" already exists\n');
    }

    // Close connection to postgres database
    await pool.end();

    // Connect to hostel_management database
    const appPool = new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'hostel_management',
      password: process.env.DB_PASSWORD || 'postgres',
      port: process.env.DB_PORT || 5432,
    });

    // Check if tables exist
    const tablesCheck = await appPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    if (tablesCheck.rows.length === 0) {
      console.log('📋 Running database schema...');
      const schemaPath = join(__dirname, 'database', 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf8');
      
      // Split by semicolons and execute each statement
      const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await appPool.query(statement);
          } catch (err) {
            // Ignore errors for CREATE TABLE IF NOT EXISTS, etc.
            if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
              console.warn('Warning:', err.message);
            }
          }
        }
      }
      console.log('✅ Schema loaded!\n');
    } else {
      console.log(`✅ Database already has ${tablesCheck.rows.length} tables\n`);
    }

    // Check if admin user exists
    const userCheck = await appPool.query("SELECT * FROM users WHERE username = 'admin'");
    
    if (userCheck.rows.length === 0) {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await appPool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
        ['admin', 'admin@hostel.com', hashedPassword, 'admin']
      );
      console.log('✅ Admin user created!');
      console.log('   Username: admin');
      console.log('   Password: admin123\n');
    } else {
      console.log('✅ Admin user already exists\n');
    }

    await appPool.end();
    console.log('🎉 Setup complete! You can now start your server with: npm run dev');

  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check your password in server/.env file');
    console.error('3. Verify DB_USER, DB_HOST, DB_PORT in .env');
    console.error('4. Try common passwords: postgres, admin, root, or empty');
    process.exit(1);
  }
}

testConnection();

