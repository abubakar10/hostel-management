import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';

const router = express.Router();

// Get all attendance records
router.get('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { date, student_id, month, year } = req.query;
    let query = `
      SELECT a.*, s.first_name, s.last_name, s.student_id as student_number
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filter by hostel_id
    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND a.hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    if (date) {
      query += ` AND a.date = $${paramCount++}`;
      params.push(date);
    }
    if (student_id) {
      query += ` AND a.student_id = $${paramCount++}`;
      params.push(student_id);
    }
    if (month && year) {
      query += ` AND EXTRACT(MONTH FROM a.date) = $${paramCount++} AND EXTRACT(YEAR FROM a.date) = $${paramCount++}`;
      params.push(month, year);
    }

    query += ' ORDER BY a.date DESC, s.first_name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get daily attendance
router.get('/daily/:date', authenticateToken, setHostelContext, async (req, res) => {
  try {
    let query = `
      SELECT a.*, s.first_name, s.last_name, s.student_id as student_number, s.room_id
      FROM attendance a
      RIGHT JOIN students s ON a.student_id = s.id AND a.date = $1
      WHERE s.status = 'active'
    `;
    const params = [req.params.date];

    // Filter by hostel_id
    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND s.hostel_id = $2`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    query += ` ORDER BY s.first_name`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Update attendance
router.post('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { student_id, date, status, remarks, hostel_id } = req.body;

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
      `INSERT INTO attendance (student_id, date, status, remarks, hostel_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id, date)
       DO UPDATE SET status = $3, remarks = $4
       RETURNING *`,
      [student_id, date, status, remarks, finalHostelId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk attendance
router.post('/bulk', authenticateToken, async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{student_id, status, remarks}]

    const results = [];
    for (const record of records) {
      const result = await pool.query(
        `INSERT INTO attendance (student_id, date, status, remarks)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (student_id, date)
         DO UPDATE SET status = $3, remarks = $4
         RETURNING *`,
        [record.student_id, date, record.status, record.remarks || '']
      );
      results.push(result.rows[0]);
    }

    res.status(201).json({ message: 'Attendance recorded successfully', records: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly report
router.get('/monthly/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;

    const result = await pool.query(`
      SELECT 
        s.id as student_id,
        s.first_name,
        s.last_name,
        s.student_id as student_number,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
        COUNT(a.id) as total_days
      FROM students s
      LEFT JOIN attendance a ON s.id = a.student_id 
        AND EXTRACT(YEAR FROM a.date) = $1 
        AND EXTRACT(MONTH FROM a.date) = $2
      WHERE s.status = 'active'
      GROUP BY s.id, s.first_name, s.last_name, s.student_id
      ORDER BY s.first_name
    `, [year, month]);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

