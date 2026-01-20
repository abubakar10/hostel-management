import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';

const router = express.Router();

// Get all leave requests
router.get('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    let query = `
      SELECT l.*, s.first_name as student_first_name, s.last_name as student_last_name,
             s.student_id, u.username as approved_by_name
      FROM leave_requests l
      LEFT JOIN students s ON l.student_id = s.id
      LEFT JOIN users u ON l.approved_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filter by hostel_id
    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND l.hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    // Filter by status
    if (req.query.status) {
      query += ` AND l.status = $${paramCount++}`;
      params.push(req.query.status);
    }

    query += ' ORDER BY l.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get leave request by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, s.first_name as student_first_name, s.last_name as student_last_name,
             s.student_id, u.username as approved_by_name
      FROM leave_requests l
      LEFT JOIN students s ON l.student_id = s.id
      LEFT JOIN users u ON l.approved_by = u.id
      WHERE l.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create leave request
router.post('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const {
      student_id, leave_type, start_date, end_date, reason,
      emergency_contact, hostel_id
    } = req.body;

    const finalHostelId = hostel_id || req.hostelId;
    if (!finalHostelId) {
      return res.status(400).json({ error: 'Hostel ID is required' });
    }

    const result = await pool.query(
      `INSERT INTO leave_requests (student_id, leave_type, start_date, end_date, reason,
       emergency_contact, status, hostel_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
       RETURNING *`,
      [student_id, leave_type, start_date, end_date, reason, emergency_contact, finalHostelId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update leave request (approve/reject)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const updateFields = [];
    const values = [];
    let paramCount = 1;

    if (status) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(status);
      
      if (status === 'approved' || status === 'rejected') {
        updateFields.push(`approved_by = $${paramCount++}`);
        values.push(req.user.id);
        updateFields.push(`approved_at = CURRENT_TIMESTAMP`);
      }
    }

    if (remarks) {
      updateFields.push(`remarks = $${paramCount++}`);
      values.push(remarks);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);
    const query = `UPDATE leave_requests SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete leave request
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM leave_requests WHERE id = $1', [req.params.id]);
    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

