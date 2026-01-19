import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';

const router = express.Router();

// Get all complaints
router.get('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { status, category, student_id } = req.query;
    let query = `
      SELECT c.*, s.first_name, s.last_name, s.student_id as student_number,
             st.first_name as staff_first_name, st.last_name as staff_last_name
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      LEFT JOIN staff st ON c.assigned_to = st.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filter by hostel_id
    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND c.hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    if (status) {
      query += ` AND c.status = $${paramCount++}`;
      params.push(status);
    }
    if (category) {
      query += ` AND c.category = $${paramCount++}`;
      params.push(category);
    }
    if (student_id) {
      query += ` AND c.student_id = $${paramCount++}`;
      params.push(student_id);
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get complaint by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, s.first_name, s.last_name, s.student_id as student_number,
             st.first_name as staff_first_name, st.last_name as staff_last_name
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      LEFT JOIN staff st ON c.assigned_to = st.id
      WHERE c.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create complaint
router.post('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { student_id, title, description, category, priority, hostel_id } = req.body;

    // Get student's hostel_id if not provided
    let finalHostelId = hostel_id || req.hostelId;
    if (!finalHostelId && student_id) {
      const student = await pool.query('SELECT hostel_id FROM students WHERE id = $1', [student_id]);
      if (student.rows.length > 0) {
        finalHostelId = student.rows[0].hostel_id;
      }
    }

    if (!finalHostelId) {
      return res.status(400).json({ error: 'Hostel ID is required' });
    }

    const result = await pool.query(
      `INSERT INTO complaints (student_id, title, description, category, priority, hostel_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [student_id, title, description, category, priority || 'medium', finalHostelId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update complaint
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, assigned_to, resolution, priority } = req.body;

    const result = await pool.query(
      `UPDATE complaints SET status = $1, assigned_to = $2, resolution = $3, 
       priority = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *`,
      [status, assigned_to, resolution, priority, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get maintenance requests
router.get('/maintenance/all', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { status, priority } = req.query;
    let query = `
      SELECT m.*, r.room_number,
             s.first_name as student_first_name, s.last_name as student_last_name,
             st.first_name as staff_first_name, st.last_name as staff_last_name
      FROM maintenance_requests m
      JOIN rooms r ON m.room_id = r.id
      LEFT JOIN students s ON m.requested_by = s.id
      LEFT JOIN staff st ON m.assigned_to = st.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filter by hostel_id
    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND m.hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    if (status) {
      query += ` AND m.status = $${paramCount++}`;
      params.push(status);
    }
    if (priority) {
      query += ` AND m.priority = $${paramCount++}`;
      params.push(priority);
    }

    query += ' ORDER BY m.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create maintenance request
router.post('/maintenance', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { room_id, requested_by, title, description, priority, hostel_id } = req.body;

    // Get room's hostel_id if not provided
    let finalHostelId = hostel_id || req.hostelId;
    if (!finalHostelId && room_id) {
      const room = await pool.query('SELECT hostel_id FROM rooms WHERE id = $1', [room_id]);
      if (room.rows.length > 0) {
        finalHostelId = room.rows[0].hostel_id;
      }
    }

    if (!finalHostelId) {
      return res.status(400).json({ error: 'Hostel ID is required' });
    }

    const result = await pool.query(
      `INSERT INTO maintenance_requests (room_id, requested_by, title, description, priority, hostel_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [room_id, requested_by, title, description, priority || 'medium', finalHostelId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update maintenance request
router.put('/maintenance/:id', authenticateToken, async (req, res) => {
  try {
    const { status, assigned_to, cost, completed_date } = req.body;

    const result = await pool.query(
      `UPDATE maintenance_requests SET status = $1, assigned_to = $2, cost = $3, 
       completed_date = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *`,
      [status, assigned_to, cost, completed_date, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

