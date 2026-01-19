// Seed script to create default admin user
// Run this after setting up the database
// node server/database/seed.js

import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const checkResult = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    
    if (checkResult.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Insert admin user
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      ['admin', 'admin@hostel.com', hashedPassword, 'admin']
    );

    console.log('✅ Admin user created successfully:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Email:', result.rows[0].email);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await pool.end();
  }
};

createAdminUser();

