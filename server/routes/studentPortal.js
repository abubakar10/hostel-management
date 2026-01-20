import express from 'express';
import { pool } from '../config/database.js';
import { authenticateStudent } from '../middleware/studentAuth.js';

const router = express.Router();

// Get student's own profile
router.get('/profile', authenticateStudent, async (req, res) => {
  try {
    const student = await pool.query(`
      SELECT s.*, r.room_number, rt.type_name as room_type, h.name as hostel_name
      FROM students s
      LEFT JOIN rooms r ON s.room_id = r.id
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN hostels h ON s.hostel_id = h.id
      WHERE s.id = $1
    `, [req.student.id]);
    
    res.json(student.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student's fees
router.get('/fees', authenticateStudent, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, s.first_name, s.last_name, s.student_id as student_number
      FROM fees f
      JOIN students s ON f.student_id = s.id
      WHERE f.student_id = $1
      ORDER BY f.due_date DESC
    `, [req.student.id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student's attendance
router.get('/attendance', authenticateStudent, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    let query = `
      SELECT * FROM attendance
      WHERE student_id = $1
    `;
    const params = [req.student.id];
    
    if (start_date) {
      query += ` AND date >= $${params.length + 1}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND date <= $${params.length + 1}`;
      params.push(end_date);
    }
    
    query += ' ORDER BY date DESC LIMIT 100';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student's complaints
router.get('/complaints', authenticateStudent, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, s.first_name, s.last_name, st.first_name as staff_first_name, st.last_name as staff_last_name
      FROM complaints c
      JOIN students s ON c.student_id = s.id
      LEFT JOIN staff st ON c.assigned_to = st.id
      WHERE c.student_id = $1
      ORDER BY c.created_at DESC
    `, [req.student.id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit complaint
router.post('/complaints', authenticateStudent, async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    
    if (!req.student.hostel_id) {
      return res.status(400).json({ error: 'Student is not assigned to a hostel' });
    }
    
    const result = await pool.query(
      `INSERT INTO complaints (student_id, title, description, category, priority, status, hostel_id)
       VALUES ($1, $2, $3, $4, $5, 'open', $6)
       RETURNING *`,
      [req.student.id, title, description, category || 'other', priority || 'medium', req.student.hostel_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get student's leave requests
router.get('/leaves', authenticateStudent, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, s.first_name, s.last_name, s.student_id, u.username as approved_by_name
      FROM leave_requests l
      LEFT JOIN students s ON l.student_id = s.id
      LEFT JOIN users u ON l.approved_by = u.id
      WHERE l.student_id = $1
      ORDER BY l.created_at DESC
    `, [req.student.id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit leave request
router.post('/leaves', authenticateStudent, async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason, emergency_contact } = req.body;
    
    if (!req.student.hostel_id) {
      return res.status(400).json({ error: 'Student is not assigned to a hostel' });
    }
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const result = await pool.query(
      `INSERT INTO leave_requests (student_id, leave_type, start_date, end_date, reason, emergency_contact, status, hostel_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
       RETURNING *`,
      [req.student.id, leave_type, start_date, end_date, reason || '', emergency_contact || '', req.student.hostel_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting leave request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get student's room transfer requests
router.get('/room-transfers', authenticateStudent, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, s.first_name, s.last_name, s.student_id,
             r1.room_number as from_room, r2.room_number as to_room,
             u.username as approved_by_name
      FROM room_transfers t
      LEFT JOIN students s ON t.student_id = s.id
      LEFT JOIN rooms r1 ON t.from_room_id = r1.id
      LEFT JOIN rooms r2 ON t.to_room_id = r2.id
      LEFT JOIN users u ON t.approved_by = u.id
      WHERE t.student_id = $1
      ORDER BY t.requested_at DESC
    `, [req.student.id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit room transfer request
router.post('/room-transfers', authenticateStudent, async (req, res) => {
  try {
    const { to_room_id, reason } = req.body;
    
    if (!to_room_id) {
      return res.status(400).json({ error: 'Destination room is required' });
    }
    
    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }
    
    if (!req.student.hostel_id) {
      return res.status(400).json({ error: 'Student is not assigned to a hostel' });
    }
    
    // Get current room from student
    const studentResult = await pool.query('SELECT room_id FROM students WHERE id = $1', [req.student.id]);
    const currentRoomId = studentResult.rows[0]?.room_id;
    
    if (!currentRoomId) {
      return res.status(400).json({ error: 'You are not currently assigned to a room' });
    }
    
    // Check if destination room exists and has space
    const roomCheck = await pool.query(
      'SELECT capacity, current_occupancy, hostel_id FROM rooms WHERE id = $1',
      [to_room_id]
    );
    
    if (roomCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Destination room not found' });
    }
    
    const room = roomCheck.rows[0];
    
    // Check if room is in same hostel
    if (room.hostel_id !== req.student.hostel_id) {
      return res.status(400).json({ error: 'You can only transfer to rooms in your hostel' });
    }
    
    // Check if trying to transfer to same room
    if (currentRoomId === parseInt(to_room_id)) {
      return res.status(400).json({ error: 'You are already in this room' });
    }
    
    if (room.current_occupancy >= room.capacity) {
      return res.status(400).json({ error: 'Destination room is full' });
    }
    
    const result = await pool.query(
      `INSERT INTO room_transfers (student_id, from_room_id, to_room_id, reason, status, hostel_id)
       VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING *`,
      [req.student.id, currentRoomId, to_room_id, reason, req.student.hostel_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting room transfer:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available rooms for transfer
router.get('/rooms/available', authenticateStudent, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, rt.type_name, rt.price_per_month,
             (r.capacity - r.current_occupancy) as available_spots
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.hostel_id = $1 
        AND r.status = 'available'
        AND (r.capacity - r.current_occupancy) > 0
        AND r.id != (SELECT room_id FROM students WHERE id = $2)
      ORDER BY r.room_number
    `, [req.student.hostel_id, req.student.id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student's notifications
router.get('/notifications', authenticateStudent, async (req, res) => {
  try {
    // Get user account linked to student email if exists
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [req.student.email]
    );
    
    if (userResult.rows.length === 0) {
      return res.json([]);
    }
    
    const result = await pool.query(`
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [userResult.rows[0].id]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

