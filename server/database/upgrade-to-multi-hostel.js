// Script to upgrade existing database to multi-hostel support
import pkg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function upgradeDatabase() {
  console.log('🔄 Upgrading database to multi-hostel support...\n');

  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'hostel_management',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
  });

  try {
    // Read and execute upgrade schema
    const schemaPath = join(__dirname, 'multi-hostel-schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    // Split by semicolons and execute
    const statements = schema
      .replace(/--.*$/gm, '') // Remove comments
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.toLowerCase().includes('on conflict'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
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

    console.log('✅ Database upgraded successfully!\n');
    console.log('📝 Next steps:');
    console.log('1. Update existing admin user to super_admin:');
    console.log('   UPDATE users SET role = \'super_admin\' WHERE username = \'admin\';');
    console.log('2. Create a default hostel if needed');
    console.log('3. Assign existing data to a hostel\n');

  } catch (error) {
    console.error('❌ Upgrade failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

upgradeDatabase();

