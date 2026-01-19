// Test Supabase connection
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pkg;

const connectionString = process.env.DATABASE_URL || 
  `postgresql://postgres:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

console.log('Testing connection to:', connectionString.replace(/:[^:@]+@/, ':****@'));

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version.split(',')[0]);
    
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  }
}

testConnection();

