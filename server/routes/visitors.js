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

    // Validate required fields with user-friendly messages
    if (!student_id || student_id.toString().trim() === '') {
      return res.status(400).json({ error: 'Please select a student for this visitor' });
    }

    if (!visitor_name || visitor_name.trim() === '') {
      return res.status(400).json({ error: 'Please enter the visitor name' });
    }

    // Validate visitor name - must contain at least one letter (not just numbers)
    const visitorNameTrimmed = visitor_name.trim();
    if (visitorNameTrimmed.length < 2) {
      return res.status(400).json({ error: 'Visitor name must be at least 2 characters long' });
    }

    // Check if name is just numbers
    if (/^\d+$/.test(visitorNameTrimmed)) {
      return res.status(400).json({ error: 'Visitor name cannot be just numbers. Please enter a valid name with letters.' });
    }

    // Check if name contains at least one letter
    if (!/[a-zA-Z]/.test(visitorNameTrimmed)) {
      return res.status(400).json({ error: 'Visitor name must contain at least one letter' });
    }

    // Verify student exists
    const studentCheck = await pool.query('SELECT id, hostel_id FROM students WHERE id = $1', [student_id]);
    if (studentCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Selected student does not exist. Please select a valid student.' });
    }

    const finalHostelId = hostel_id || req.hostelId || studentCheck.rows[0].hostel_id;
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
    // Provide user-friendly error messages
    if (error.code === '23503') { // Foreign key violation
      return res.status(400).json({ error: 'Selected student does not exist. Please select a valid student.' });
    }
    res.status(500).json({ error: error.message || 'An error occurred while saving the visitor. Please try again.' });
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

    // Validate required fields with user-friendly messages
    if (!visitor_name || visitor_name.trim() === '') {
      return res.status(400).json({ error: 'Please enter the visitor name' });
    }

    // Validate visitor name - must contain at least one letter (not just numbers)
    const visitorNameTrimmed = visitor_name.trim();
    if (visitorNameTrimmed.length < 2) {
      return res.status(400).json({ error: 'Visitor name must be at least 2 characters long' });
    }

    // Check if name is just numbers
    if (/^\d+$/.test(visitorNameTrimmed)) {
      return res.status(400).json({ error: 'Visitor name cannot be just numbers. Please enter a valid name with letters.' });
    }

    // Check if name contains at least one letter
    if (!/[a-zA-Z]/.test(visitorNameTrimmed)) {
      return res.status(400).json({ error: 'Visitor name must contain at least one letter' });
    }

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
    res.status(500).json({ error: error.message || 'An error occurred while updating the visitor. Please try again.' });
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

