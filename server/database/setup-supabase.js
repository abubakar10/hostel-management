// Setup script to run schema on Supabase
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

// Support both DATABASE_URL and individual env vars
let poolConfig;

if (process.env.DATABASE_URL) {
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
} else {
  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: process.env.DB_HOST?.includes('supabase') ? { rejectUnauthorized: false } : false
  };
}

const pool = new Pool(poolConfig);

async function setupSupabase() {
  console.log('🔗 Connecting to Supabase database...\n');

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Supabase!\n');

    // Check if tables exist
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `);

    if (tableCheck.rows.length === 0) {
      console.log('📋 Running initial schema...\n');
      
      // Read and execute schema
      const schemaPath = join(__dirname, 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log('✅ Initial schema created!\n');

      // Run multi-hostel upgrade
      console.log('🔄 Running multi-hostel upgrade...\n');
      const upgradePath = join(__dirname, 'multi-hostel-schema.sql');
      const upgrade = readFileSync(upgradePath, 'utf8');

      const statements = upgrade
        .replace(/--.*$/gm, '')
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.toLowerCase().includes('on conflict'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await pool.query(statement);
          } catch (err) {
            if (!err.message.includes('already exists') && 
                !err.message.includes('duplicate')) {
              console.warn(`Warning: ${err.message.substring(0, 100)}`);
            }
          }
        }
      }
      console.log('✅ Multi-hostel upgrade completed!\n');
    } else {
      console.log('✅ Tables already exist\n');
    }

    // Check if admin user exists
    const userCheck = await pool.query("SELECT * FROM users WHERE username = 'admin'");
    
    if (userCheck.rows.length === 0) {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (username, email, password, role, hostel_id) VALUES ($1, $2, $3, $4, $5)',
        ['admin', 'admin@hostel.com', hashedPassword, 'super_admin', null]
      );
      console.log('✅ Admin user created!');
      console.log('   Username: admin');
      console.log('   Password: admin123\n');
    } else {
      console.log('✅ Admin user already exists\n');
    }

    // List all tables
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('📊 Database tables:');
    allTables.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    console.log('\n🎉 Supabase database setup complete!');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\n💡 Make sure:');
    console.error('1. DATABASE_URL is set correctly in your .env file');
    console.error('2. Your Supabase database password is correct');
    console.error('3. Your IP is allowed (Supabase allows all by default)');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupSupabase();

