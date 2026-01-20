import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';

const router = express.Router();

// Get all visitors
router.get('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    let query = `
      SELECT v.*, s.first_name as student_first_name, s.last_name as student_last_name, s.student_id
      FROM visitors v
      LEFT JOIN students s ON v.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filter by hostel_id
    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND v.hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    // Filter by status
    if (req.query.status) {
      query += ` AND v.status = $${paramCount++}`;
      params.push(req.query.status);
    }

    query += ' ORDER BY v.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get visitor by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, s.first_name as student_first_name, s.last_name as student_last_name, s.student_id
      FROM visitors v
      LEFT JOIN students s ON v.student_id = s.id
      WHERE v.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create visitor (check-in)
router.post('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const {
      student_id, visitor_name, visitor_phone, visitor_id_type,
      visitor_id_number, relationship, purpose, hostel_id
    } = req.body;

    const finalHostelId = hostel_id || req.hostelId;
    if (!finalHostelId) {
      return res.status(400).json({ error: 'Hostel ID is required' });
    }

    const result = await pool.query(
      `INSERT INTO visitors (student_id, visitor_name, visitor_phone, visitor_id_type,
       visitor_id_number, relationship, purpose, entry_time, status, hostel_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, 'inside', $8)
       RETURNING *`,
      [student_id, visitor_name, visitor_phone, visitor_id_type, visitor_id_number,
       relationship, purpose, finalHostelId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update visitor (check-out)
router.put('/:id/checkout', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE visitors SET exit_time = CURRENT_TIMESTAMP, status = 'exited'
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update visitor
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      visitor_name, visitor_phone, visitor_id_type, visitor_id_number,
      relationship, purpose
    } = req.body;

    const result = await pool.query(
      `UPDATE visitors SET visitor_name = $1, visitor_phone = $2, visitor_id_type = $3,
       visitor_id_number = $4, relationship = $5, purpose = $6
       WHERE id = $7 RETURNING *`,
      [visitor_name, visitor_phone, visitor_id_type, visitor_id_number,
       relationship, purpose, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete visitor
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM visitors WHERE id = $1', [req.params.id]);
    res.json({ message: 'Visitor record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

