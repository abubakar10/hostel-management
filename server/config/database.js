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
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isSupabase || process.env.DATABASE_URL.includes('sslmode=require') 
      ? { rejectUnauthorized: false } 
      : false
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
    ssl: isSupabase ? { rejectUnauthorized: false } : false
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

