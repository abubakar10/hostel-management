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

    // Validate required fields
    if (!student_id || !date || !status) {
      return res.status(400).json({ error: 'Student ID, date, and status are required' });
    }

    // Get student's information including registration date
    const studentResult = await pool.query(
      'SELECT hostel_id, created_at FROM students WHERE id = $1',
      [student_id]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = studentResult.rows[0];
    const studentRegistrationDate = new Date(student.created_at);
    const attendanceDate = new Date(date);

    // Validate that attendance date is not before student registration
    if (attendanceDate < studentRegistrationDate) {
      const registrationDateStr = studentRegistrationDate.toISOString().split('T')[0];
      return res.status(400).json({ 
        error: `Cannot mark attendance for dates before student registration. Student was registered on ${registrationDateStr}.` 
      });
    }

    // Get student's hostel_id if not provided
    let finalHostelId = hostel_id || req.hostelId;
    if (!finalHostelId) {
      finalHostelId = student.hostel_id;
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
router.post('/bulk', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { date, records } = req.body; // records: [{student_id, status, remarks}]

    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Date and records array are required' });
    }

    const attendanceDate = new Date(date);
    const results = [];
    const errors = [];

    // Get all students' registration dates in one query for efficiency
    const studentIds = records.map(r => r.student_id);
    const studentsResult = await pool.query(
      `SELECT id, created_at, hostel_id FROM students WHERE id = ANY($1::int[])`,
      [studentIds]
    );

    const studentsMap = new Map();
    studentsResult.rows.forEach(s => {
      studentsMap.set(s.id, s);
    });

    for (const record of records) {
      const student = studentsMap.get(record.student_id);
      
      if (!student) {
        errors.push({ student_id: record.student_id, error: 'Student not found' });
        continue;
      }

      // Validate that attendance date is not before student registration
      const studentRegistrationDate = new Date(student.created_at);
      if (attendanceDate < studentRegistrationDate) {
        const registrationDateStr = studentRegistrationDate.toISOString().split('T')[0];
        errors.push({ 
          student_id: record.student_id, 
          error: `Cannot mark attendance before registration date (${registrationDateStr})` 
        });
        continue;
      }

      // Get hostel_id
      let finalHostelId = req.hostelId;
      if (!finalHostelId) {
        finalHostelId = student.hostel_id;
      }

      try {
        const result = await pool.query(
          `INSERT INTO attendance (student_id, date, status, remarks, hostel_id)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (student_id, date)
           DO UPDATE SET status = $3, remarks = $4
           RETURNING *`,
          [record.student_id, date, record.status, record.remarks || '', finalHostelId]
        );
        results.push(result.rows[0]);
      } catch (error) {
        errors.push({ student_id: record.student_id, error: error.message });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      return res.status(400).json({ 
        error: 'Failed to record attendance for all students',
        errors 
      });
    }

    res.status(201).json({ 
      message: `Attendance recorded for ${results.length} student(s)`,
      records: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get monthly report
router.get('/monthly/:year/:month', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { year, month } = req.params;
    const params = [year, month];
    let paramCount = 3;

    // Determine hostel_id filter
    let hostelIdFilter = null;
    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      hostelIdFilter = req.hostelId || req.query.hostel_id;
    }

    let query = `
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
    `;

    // Add hostel_id filter to attendance join to ensure we only count attendance from the same hostel
    if (hostelIdFilter) {
      query += ` AND (a.hostel_id = $${paramCount} OR a.hostel_id IS NULL)`;
    }

    query += ` WHERE s.status = 'active'`;

    // Filter students by hostel_id (unless super_admin viewing all hostels)
    if (hostelIdFilter) {
      query += ` AND s.hostel_id = $${paramCount}`;
      params.push(hostelIdFilter);
    }

    query += `
      GROUP BY s.id, s.first_name, s.last_name, s.student_id
      ORDER BY s.first_name
    `;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching monthly attendance:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

