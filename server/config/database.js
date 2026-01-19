import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Support both DATABASE_URL (for Vercel/Railway) and individual env vars
let poolConfig;

if (process.env.DATABASE_URL) {
  // Use connection string (for Vercel, Railway, Supabase, etc.)
  // Supabase requires SSL, so always enable it for Supabase connections
  const isSupabase = process.env.DATABASE_URL.includes('supabase');
  
  // For Supabase, ensure SSL is properly configured
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isSupabase || process.env.DATABASE_URL.includes('sslmode=require') 
      ? { 
          rejectUnauthorized: false,
          require: true 
        } 
      : false,
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
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

