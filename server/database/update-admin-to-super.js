// Update admin user to super_admin
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hostel_management',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

async function updateAdmin() {
  try {
    console.log('🔄 Updating admin user to super_admin...\n');
    
    const result = await pool.query(
      `UPDATE users SET role = 'super_admin', hostel_id = NULL WHERE username = 'admin' RETURNING *`
    );

    if (result.rows.length > 0) {
      console.log('✅ Admin user updated successfully!');
      console.log('   Username:', result.rows[0].username);
      console.log('   Role:', result.rows[0].role);
      console.log('   Hostel ID:', result.rows[0].hostel_id);
    } else {
      console.log('⚠️  No admin user found to update');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

updateAdmin();

