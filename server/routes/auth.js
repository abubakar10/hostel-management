import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { pool } from '../config/database.js';
import { sendPasswordResetEmail } from '../config/email.js';
import { checkEmailExists, isValidEmailFormat } from '../utils/emailValidation.js';
import { signStaffToken, signStudentToken } from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Create password_reset_tokens table if it doesn't exist
const ensurePasswordResetTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        user_type VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (error) {
    console.error('Error creating password_reset_tokens table:', error);
  }
};

// Initialize table on startup
ensurePasswordResetTable();

// Register is staff-only. Super admin creates manager accounts from Users.
router.post('/register', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only the owner can create staff accounts' });
    }

    const { username, email, password, role, hostel_id } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    if (!email || !isValidEmailFormat(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const emailCheck = await checkEmailExists(email);
    if (emailCheck.exists) {
      return res.status(400).json({ error: emailCheck.message });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const safeRole = role === 'super_admin' ? 'super_admin' : 'admin';
    const finalHostelId = safeRole === 'super_admin' ? null : hostel_id;

    const result = await pool.query(
      'INSERT INTO users (username, email, password, role, hostel_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, hostel_id',
      [username, email, hashedPassword, safeRole, finalHostelId]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Could not create the account. Please try again.' });
  }
});

// Login
router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 12 }), async (req, res) => {
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
      let isValidPassword = false;

      if (student.password) {
        isValidPassword = await bcrypt.compare(password, student.password);
      } else if (password === student.student_id) {
        // One-time migration: first login with Student ID stores a hashed password
        const hashedPassword = await bcrypt.hash(password, 10);
        try {
          await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS password VARCHAR(255)');
        } catch (_) {}
        await pool.query('UPDATE students SET password = $1 WHERE id = $2', [hashedPassword, student.id]);
        isValidPassword = true;
      }

      if (!isValidPassword) {
        return res.status(401).json({ error: 'Wrong ID or password' });
      }

      const token = signStudentToken(student);

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
      return res.status(401).json({ error: 'Wrong username or password' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Wrong username or password' });
    }

    const token = signStaffToken(user);

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

// Forgot Password - Request reset token
router.post('/forgot-password', rateLimit({ windowMs: 15 * 60 * 1000, max: 8 }), async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email or Student ID is required' });
    }

    let user = null;
    let userEmail = null;
    let detectedUserType = null;

    // First, try to find in students table (by email or student_id)
    const studentResult = await pool.query(
      'SELECT id, student_id, email, first_name, last_name FROM students WHERE (student_id = $1 OR email = $1) AND status = $2',
      [email, 'active']
    );

    if (studentResult.rows.length > 0) {
      user = studentResult.rows[0];
      userEmail = user.email || `${user.student_id}@hostel.local`;
      detectedUserType = 'student';
    } else {
      // If not found in students, check users table (by email or username)
      const userResult = await pool.query(
        'SELECT id, username, email FROM users WHERE email = $1 OR username = $1',
        [email]
      );

      if (userResult.rows.length > 0) {
        user = userResult.rows[0];
        userEmail = user.email;
        detectedUserType = 'admin';
      }
    }

    // If user not found in either table, return generic success (security best practice)
    if (!user || !detectedUserType) {
      return res.json({
        success: true,
        message: 'If the email exists, a reset link has been sent to your email.',
        emailSent: false
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Delete any existing tokens for this email
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE email = $1 AND user_type = $2',
      [userEmail, detectedUserType]
    );

    // Insert new token
    await pool.query(
      'INSERT INTO password_reset_tokens (email, token, user_type, expires_at) VALUES ($1, $2, $3, $4)',
      [userEmail, resetToken, detectedUserType, expiresAt]
    );

    // Get base URL from request or environment
    const baseUrl = process.env.FRONTEND_URL || 
                   process.env.CLIENT_URL || 
                   req.headers.origin || 
                   `http://localhost:${process.env.CLIENT_PORT || 3000}`;

    // Get user name for email
    const userName = detectedUserType === 'student' 
      ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.student_id
      : user.username || user.email;

    // Send password reset email
    const emailResult = await sendPasswordResetEmail(
      userEmail,
      resetToken,
      detectedUserType,
      baseUrl,
      userName
    );

    // Always return success (don't reveal if email exists)
    // If email sending failed, token is logged to console for development
    res.json({
      success: true,
      message: emailResult.success 
        ? 'Password reset link has been sent to your email'
        : 'Password reset token generated. Check console for token if email is not configured.',
      emailSent: emailResult.success
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Verify Reset Token
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token, userType } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Auto-detect user type from token if not provided
    let query, params;
    if (userType) {
      query = 'SELECT * FROM password_reset_tokens WHERE token = $1 AND user_type = $2 AND used = FALSE AND expires_at > NOW()';
      params = [token, userType];
    } else {
      query = 'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()';
      params = [token];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.json({ valid: false, error: 'Invalid or expired token' });
    }

    res.json({ 
      valid: true, 
      userType: result.rows[0].user_type // Return detected user type
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, userType } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Verify token and auto-detect user type from token
    let query, params;
    if (userType) {
      query = 'SELECT * FROM password_reset_tokens WHERE token = $1 AND user_type = $2 AND used = FALSE AND expires_at > NOW()';
      params = [token, userType];
    } else {
      query = 'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()';
      params = [token];
    }

    const tokenResult = await pool.query(query, params);

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const tokenData = tokenResult.rows[0];
    const email = tokenData.email;
    const detectedUserType = tokenData.user_type; // Use user type from token

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password based on user type (from token)
    if (detectedUserType === 'student') {
      // Check if password column exists, if not add it
      try {
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS password VARCHAR(255)');
      } catch (alterError) {
        // Column might already exist, ignore error
        if (alterError.code !== '42701') {
          console.error('Error adding password column:', alterError);
        }
      }
      
      // Update student password
      await pool.query(
        'UPDATE students SET password = $1 WHERE (email = $2 OR student_id = $2) AND status = $3',
        [hashedPassword, email, 'active']
      );
    } else {
      // Update user password
      await pool.query(
        'UPDATE users SET password = $1 WHERE email = $2',
        [hashedPassword, email]
      );
    }

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE token = $1',
      [token]
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;

