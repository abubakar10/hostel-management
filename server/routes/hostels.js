import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all hostels (super admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Only super_admin can see all hostels
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const result = await pool.query(
      'SELECT * FROM hostels ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get hostel by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Super admin can access any hostel, others can only access their own
    let query = 'SELECT * FROM hostels WHERE id = $1';
    const params = [id];

    if (req.user.role !== 'super_admin') {
      query += ' AND id = $2';
      params.push(req.user.hostel_id);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create hostel (super admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    const { name, address, phone, email, total_rooms, total_capacity, status } = req.body;

    const result = await pool.query(
      `INSERT INTO hostels (name, address, phone, email, total_rooms, total_capacity, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, address, phone, email, total_rooms || 0, total_capacity || 0, status || 'active']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update hostel
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, email, total_rooms, total_capacity, status } = req.body;

    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.hostel_id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `UPDATE hostels SET name = $1, address = $2, phone = $3, email = $4, 
       total_rooms = $5, total_capacity = $6, status = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 RETURNING *`,
      [name, address, phone, email, total_rooms, total_capacity, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hostel not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete hostel (super admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super admin only.' });
    }

    await pool.query('DELETE FROM hostels WHERE id = $1', [req.params.id]);
    res.json({ message: 'Hostel deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get hostel statistics
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check permissions
    if (req.user.role !== 'super_admin' && req.user.hostel_id !== parseInt(id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [students, rooms, staff, fees] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM students WHERE hostel_id = $1 AND status = $2', [id, 'active']),
      pool.query('SELECT COUNT(*) as count FROM rooms WHERE hostel_id = $1', [id]),
      pool.query('SELECT COUNT(*) as count FROM staff WHERE hostel_id = $1 AND status = $2', [id, 'active']),
      pool.query('SELECT SUM(amount) as total FROM fees WHERE hostel_id = $1 AND status = $2', [id, 'paid'])
    ]);

    res.json({
      students: parseInt(students.rows[0].count),
      rooms: parseInt(rooms.rows[0].count),
      staff: parseInt(staff.rows[0].count),
      revenue: parseFloat(fees.rows[0].total || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

