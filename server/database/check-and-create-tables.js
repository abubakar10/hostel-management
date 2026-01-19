// Check and create all required tables
import pkg from 'pg';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hostel_management',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function checkAndCreateTables() {
  console.log('🔍 Checking database tables...\n');

  try {
    // Check if students table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'students'
    `);

    if (tableCheck.rows.length === 0) {
      console.log('❌ Students table does not exist!');
      console.log('📋 Running database schema...\n');

      // Read and execute schema
      const schemaPath = join(__dirname, 'schema.sql');
      const schema = readFileSync(schemaPath, 'utf8');

      // Execute schema
      await pool.query(schema);
      console.log('✅ Initial schema created!\n');

      // Now run multi-hostel upgrade
      console.log('🔄 Running multi-hostel upgrade...\n');
      const upgradePath = join(__dirname, 'multi-hostel-schema.sql');
      const upgrade = readFileSync(upgradePath, 'utf8');

      // Split and execute upgrade statements
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
                !err.message.includes('duplicate') &&
                !err.message.includes('does not exist')) {
              console.warn(`Warning: ${err.message.substring(0, 100)}`);
            }
          }
        }
      }
      console.log('✅ Multi-hostel upgrade completed!\n');
    } else {
      console.log('✅ Students table exists');
      
      // Check if hostel_id column exists
      const columnCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'students' 
        AND column_name = 'hostel_id'
      `);

      if (columnCheck.rows.length === 0) {
        console.log('⚠️  hostel_id column missing. Running multi-hostel upgrade...\n');
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
        console.log('✅ hostel_id column exists');
      }
    }

    // Verify all tables exist
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Database tables:');
    allTables.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    console.log('\n🎉 Database is ready!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkAndCreateTables();

