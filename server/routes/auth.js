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
    const { username, password, userType } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if student login
    if (userType === 'student') {
      // Student login - check students table
      let studentResult;
      try {
        studentResult = await pool.query(
          'SELECT * FROM students WHERE (student_id = $1 OR email = $1) AND status = $2',
          [username, 'active']
        );
      } catch (dbError) {
        console.error('Database query error:', dbError);
        if (dbError.code === '42P01') {
          return res.status(500).json({ 
            error: 'Database tables not found. Please run the SQL setup script.',
            details: 'The students table does not exist.'
          });
        }
        throw dbError;
      }

      if (studentResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials or account inactive' });
      }

      const student = studentResult.rows[0];
      
      // Check if student has a password set (if password column exists)
      // For now, we'll use a default password system or email-based auth
      // If password column doesn't exist, we'll use student_id as default password
      let isValidPassword = false;
      
      if (student.password) {
        isValidPassword = await bcrypt.compare(password, student.password);
      } else {
        // Default: use student_id as password for initial setup
        // In production, students should set their password
        isValidPassword = password === student.student_id || password === 'student123';
      }

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { 
          id: student.id, 
          student_id: student.student_id, 
          email: student.email,
          role: 'student',
          studentData: true
        },
        process.env.JWT_SECRET || 'your_jwt_secret_key_here',
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: student.id,
          student_id: student.student_id,
          email: student.email,
          first_name: student.first_name,
          last_name: student.last_name,
          role: 'student',
          hostel_id: student.hostel_id
        }
      });
    }

    // Admin/Staff login - check users table
    let result;
    try {
      result = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $1', [username]);
    } catch (dbError) {
      console.error('Database query error:', dbError);
      if (dbError.code === '42P01') {
        return res.status(500).json({ 
          error: 'Database tables not found. Please run the SQL setup script in Supabase.',
          details: 'The users table does not exist. Run SUPABASE_SQL_SETUP.sql in Supabase SQL Editor.'
        });
      }
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

