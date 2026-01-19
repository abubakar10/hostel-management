import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Support both DATABASE_URL (for Vercel/Railway) and individual env vars
let poolConfig;

if (process.env.DATABASE_URL) {
  // Use connection string (for Vercel, Railway, Supabase, etc.)
  const isSupabase = process.env.DATABASE_URL.includes('supabase');
  const isPooler = process.env.DATABASE_URL.includes('pooler.supabase.com');
  const hasSSLMode = process.env.DATABASE_URL.includes('sslmode=');
  
  // For Supabase (especially pooler), ensure SSL is properly configured
  // Supabase pooler requires SSL but the connection string may already include sslmode
  let sslConfig = false;
  
  if (isSupabase) {
    // Supabase always requires SSL
    // If sslmode is in the URL, we still need to set ssl object for node-postgres
    sslConfig = {
      rejectUnauthorized: false, // Supabase uses self-signed certificates
    };
    
    // Log connection type for debugging
    if (isPooler) {
      console.log('🔗 Using Supabase Connection Pooler');
    } else {
      console.log('🔗 Using Supabase Direct Connection');
    }
  } else if (hasSSLMode) {
    // Other providers with SSL in connection string
    sslConfig = {
      rejectUnauthorized: false,
    };
  }
  
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
    // Connection pool settings for serverless (Vercel)
    max: process.env.NODE_ENV === 'production' ? 2 : 10, // Max 2 connections for Vercel serverless
    idleTimeoutMillis: process.env.NODE_ENV === 'production' ? 30000 : 0, // Close idle connections faster
    connectionTimeoutMillis: 10000, // 10 seconds
  };
} else {
  // Use individual environment variables
  const isSupabase = process.env.DB_HOST?.includes('supabase');
  poolConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'hostel_management',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: isSupabase ? { 
      rejectUnauthorized: false,
      require: true 
    } : false,
    // Connection pool settings
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

export const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', (client) => {
  console.log('✅ Connected to PostgreSQL database');
  if (process.env.DATABASE_URL?.includes('supabase')) {
    console.log('   Using Supabase connection');
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client:', err.message);
  console.error('   Error code:', err.code);
  if (err.code === 'ENOTFOUND') {
    console.error('   DNS resolution failed - check your DATABASE_URL hostname');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('   Connection refused - check host and port');
  } else if (err.code === '28P01') {
    console.error('   Authentication failed - check username and password');
  }
  // Don't exit in production (Vercel serverless)
  if (process.env.NODE_ENV !== 'production') {
    process.exit(-1);
  }
});

