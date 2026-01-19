import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, hostel_id } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // If role is super_admin, hostel_id should be null
    const finalHostelId = (role === 'super_admin') ? null : hostel_id;

    const result = await pool.query(
      'INSERT INTO users (username, email, password, role, hostel_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, hostel_id',
      [username, email, hashedPassword, role || 'admin', finalHostelId]
    );

    const token = jwt.sign(
      { id: result.rows[0].id, username: result.rows[0].username, role: result.rows[0].role },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check database connection first
    let result;
    try {
      result = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $1', [username]);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      // Check if it's a "relation does not exist" error
      if (dbError.code === '42P01') {
        return res.status(500).json({ 
          error: 'Database tables not found. Please run the SQL setup script in Supabase.',
          details: 'The users table does not exist. Run SUPABASE_SQL_SETUP.sql in Supabase SQL Editor.'
        });
      }
      // Check if it's a connection error
      if (dbError.code === 'ECONNREFUSED' || dbError.code === 'ENOTFOUND') {
        return res.status(500).json({ 
          error: 'Database connection failed. Please check your DATABASE_URL.',
          details: dbError.message
        });
      }
      throw dbError;
    }

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        hostel_id: user.hostel_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;

