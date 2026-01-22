// User management routes (for super admin to create hostel admins)
import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { checkEmailExists, isValidEmailFormat } from '../utils/emailValidation.js';

const router = express.Router();

// Get all users (super admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const result = await pool.query(`
      SELECT u.id, u.username, u.email, u.role, u.hostel_id, u.created_at,
             h.name as hostel_name
      FROM users u
      LEFT JOIN hostels h ON u.hostel_id = h.id
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user (super admin only - for creating hostel admins)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { username, email, password, role, hostel_id } = req.body;

    console.log('Creating user with data:', { username, email, role, hostel_id, hasPassword: !!password });

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Validate email format
    if (!isValidEmailFormat(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if email already exists in any table
    const emailCheck = await checkEmailExists(email);
    if (emailCheck.exists) {
      return res.status(400).json({ error: emailCheck.message });
    }

    // Validate hostel_id for non-super-admin users
    if (role !== 'super_admin' && !hostel_id) {
      return res.status(400).json({ error: 'Hostel ID is required for admin users' });
    }

    // Check if hostel exists
    if (hostel_id) {
      const hostelIdInt = parseInt(hostel_id);
      if (isNaN(hostelIdInt)) {
        return res.status(400).json({ error: 'Invalid hostel ID format' });
      }
      const hostelCheck = await pool.query('SELECT id FROM hostels WHERE id = $1', [hostelIdInt]);
      if (hostelCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Hostel not found' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // If role is super_admin, hostel_id should be null
    const finalHostelId = (role === 'super_admin') ? null : (hostel_id ? parseInt(hostel_id) : null);

    console.log('Inserting user with finalHostelId:', finalHostelId);

    const result = await pool.query(
      `INSERT INTO users (username, email, password, role, hostel_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, role, hostel_id, created_at`,
      [username, email, hashedPassword, role || 'admin', finalHostelId]
    );

    console.log('User created successfully:', result.rows[0]);

    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { username, email, role, hostel_id, password } = req.body;
    const userId = req.params.id;

    // Get current user
    const currentUser = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (currentUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate email format if email is being updated
    if (email && !isValidEmailFormat(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if email already exists in any table (excluding current user)
    if (email && email !== currentUser.rows[0].email) {
      const emailCheck = await checkEmailExists(email, userId);
      if (emailCheck.exists) {
        return res.status(400).json({ error: emailCheck.message });
      }
    }

    // Validate hostel_id for non-super-admin users
    if (role !== 'super_admin' && !hostel_id) {
      return res.status(400).json({ error: 'Hostel ID is required for admin users' });
    }

    // Check if hostel exists
    if (hostel_id) {
      const hostelCheck = await pool.query('SELECT id FROM hostels WHERE id = $1', [hostel_id]);
      if (hostelCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Hostel not found' });
      }
    }

    const finalHostelId = (role === 'super_admin') ? null : hostel_id;

    let updateQuery = 'UPDATE users SET username = $1, email = $2, role = $3, hostel_id = $4 WHERE id = $5 RETURNING *';
    const updateParams = [username, email, role, finalHostelId, userId];

    // Update password if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery = 'UPDATE users SET username = $1, email = $2, role = $3, hostel_id = $4, password = $5 WHERE id = $6 RETURNING *';
      updateParams.splice(4, 0, hashedPassword);
      updateParams.push(userId);
    }

    const result = await pool.query(updateQuery, updateParams);

    res.json({
      message: 'User updated successfully',
      user: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email,
        role: result.rows[0].role,
        hostel_id: result.rows[0].hostel_id
      }
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    // Prevent deleting yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

