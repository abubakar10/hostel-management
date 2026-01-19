// Test script to verify Supabase connection from Vercel-like environment
// Run this locally with your Vercel DATABASE_URL to test before deploying

import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

// Mask password in connection string for logging
const maskedUrl = connectionString.replace(/:[^:@]+@/, ':****@');
console.log('🔗 Testing connection to:', maskedUrl);
console.log('');

const isSupabase = connectionString.includes('supabase');
const isPooler = connectionString.includes('pooler.supabase.com');

if (isSupabase) {
  console.log('📍 Detected: Supabase connection');
  if (isPooler) {
    console.log('   Type: Connection Pooler (recommended for serverless)');
  } else {
    console.log('   Type: Direct connection');
  }
  console.log('');
}

// Configure pool with same settings as production
const poolConfig = {
  connectionString: connectionString,
  ssl: isSupabase ? {
    rejectUnauthorized: false,
  } : false,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

const pool = new Pool(poolConfig);

async function testConnection() {
  try {
    console.log('⏳ Attempting to connect...');
    
    // Test basic connection
    const result = await pool.query('SELECT NOW(), version()');
    console.log('✅ Connection successful!');
    console.log('   Current time:', result.rows[0].now);
    console.log('   PostgreSQL version:', result.rows[0].version.split(',')[0]);
    console.log('');
    
    // Check tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log(`📊 Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });
    console.log('');
    
    // Check if users table exists and has data
    const usersCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (usersCheck.rows[0].exists) {
      const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
      console.log(`👥 Users table: ${userCount.rows[0].count} users found`);
      
      // Try to query a user (for login test)
      const testUser = await pool.query('SELECT username, role FROM users LIMIT 1');
      if (testUser.rows.length > 0) {
        console.log(`   Sample user: ${testUser.rows[0].username} (${testUser.rows[0].role})`);
      }
    } else {
      console.warn('⚠️  Users table not found!');
      console.warn('   → Run SUPABASE_SQL_SETUP.sql in Supabase SQL Editor');
    }
    
    console.log('');
    console.log('✅ All tests passed! Your connection string is correct.');
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('');
    console.error('Error details:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('');
    
    if (error.code === 'ENOTFOUND') {
      console.error('🔍 Issue: DNS resolution failed');
      console.error('   → Check if the hostname in DATABASE_URL is correct');
      console.error('   → For Supabase pooler, use: aws-1-ap-south-1.pooler.supabase.com:6543');
      console.error('   → For Supabase direct, use: db.wmxugfajiqhfddxdpopo.supabase.co:5432');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🔍 Issue: Connection refused');
      console.error('   → Check if the port is correct (6543 for pooler, 5432 for direct)');
      console.error('   → Check if your IP is allowed in Supabase (Settings → Database → Connection Pooling)');
    } else if (error.code === '28P01') {
      console.error('🔍 Issue: Authentication failed');
      console.error('   → Check if the password in DATABASE_URL is correct');
      console.error('   → For pooler, username format should be: postgres.wmxugfajiqhfddxdpopo');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('🔍 Issue: Connection timeout');
      console.error('   → Check your network connection');
      console.error('   → Try using the pooler URL instead of direct connection');
    } else if (error.code === '42P01') {
      console.error('🔍 Issue: Table does not exist');
      console.error('   → Run SUPABASE_SQL_SETUP.sql in Supabase SQL Editor');
    } else {
      console.error('🔍 Full error:', error);
    }
    
    console.error('');
    console.error('💡 Tips:');
    console.error('   1. Verify DATABASE_URL in Vercel environment variables');
    console.error('   2. Use Connection Pooler URL (port 6543) for serverless');
    console.error('   3. Format: postgresql://postgres.PROJECT_REF:PASSWORD@HOST:6543/postgres?sslmode=require');
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();

