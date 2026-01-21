import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hostel_management',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function fixRoomConstraint() {
  console.log('🔧 Fixing room number constraint...\n');

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to database!\n');

    // Read and execute migration
    const migrationPath = join(__dirname, 'fix-room-number-constraint.sql');
    const migration = readFileSync(migrationPath, 'utf8');

    // Execute migration
    await pool.query(migration);
    console.log('✅ Room number constraint fixed successfully!\n');
    console.log('📝 Room numbers are now unique per hostel, not globally.\n');
    console.log('✨ You can now add room number 1 in multiple hostels!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing constraint:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixRoomConstraint();

