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
  
  // For Supabase, we need to handle SSL certificates properly
  // Supabase uses self-signed certificates, so we must disable certificate validation
  let sslConfig = false;
  
  // Parse connection string - remove sslmode parameter to handle SSL via config
  let connectionString = process.env.DATABASE_URL;
  
  // Remove sslmode from connection string - we'll handle SSL via config object
  // This prevents conflicts between URL parameters and config object
  connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '');
  
  if (isSupabase) {
    // Supabase requires SSL but uses self-signed certificates
    // We MUST set rejectUnauthorized: false to allow self-signed certs
    // Using an object with rejectUnauthorized: false is the correct way
    sslConfig = {
      rejectUnauthorized: false, // Critical: allows self-signed certificates from Supabase
    };
    
    // Log connection type for debugging
    if (isPooler) {
      console.log('🔗 Using Supabase Connection Pooler');
    } else {
      console.log('🔗 Using Supabase Direct Connection');
    }
    console.log('🔒 SSL: rejectUnauthorized=false (allowing self-signed certs)');
  } else if (process.env.DATABASE_URL.includes('sslmode=require') || 
             process.env.DATABASE_URL.includes('ssl=true')) {
    // Other providers with SSL requirement
    sslConfig = {
      rejectUnauthorized: false,
    };
  }
  
  poolConfig = {
    connectionString: connectionString,
    // CRITICAL: SSL config must be set as an object for Supabase
    // The ssl object overrides any SSL settings in the connection string
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

