import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';

const router = express.Router();

// Get all rooms
router.get('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    let query = `
      SELECT r.*, rt.type_name, rt.capacity as type_capacity, rt.price_per_month,
             COUNT(s.id) as current_occupancy_count
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN students s ON r.id = s.room_id AND s.status = 'active'
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filter by hostel_id
    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND r.hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    query += ` GROUP BY r.id, rt.type_name, rt.capacity, rt.price_per_month ORDER BY r.room_number`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get room by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, rt.type_name, rt.capacity as type_capacity, rt.price_per_month
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE r.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get available rooms
router.get('/availability/available', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, rt.type_name, rt.capacity as type_capacity, rt.price_per_month,
             r.capacity - COALESCE(COUNT(s.id), 0) as available_spots
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      LEFT JOIN students s ON r.id = s.room_id AND s.status = 'active'
      WHERE r.status = 'available'
      GROUP BY r.id, rt.type_name, rt.capacity, rt.price_per_month
      HAVING r.capacity - COALESCE(COUNT(s.id), 0) > 0
      ORDER BY r.room_number
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get room types
router.get('/types/all', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM room_types ORDER BY capacity');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create room
router.post('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { room_number, room_type_id, floor, capacity, status, amenities, hostel_id } = req.body;

    const finalHostelId = hostel_id || req.hostelId;
    if (!finalHostelId) {
      return res.status(400).json({ error: 'Hostel ID is required' });
    }

    const result = await pool.query(
      `INSERT INTO rooms (room_number, room_type_id, floor, capacity, status, amenities, hostel_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [room_number, room_type_id, floor, capacity, status || 'available', amenities || [], finalHostelId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Room number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update room
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { room_number, room_type_id, floor, capacity, status, amenities } = req.body;

    const result = await pool.query(
      `UPDATE rooms SET room_number = $1, room_type_id = $2, floor = $3, 
       capacity = $4, status = $5, amenities = $6 WHERE id = $7 RETURNING *`,
      [room_number, room_type_id, floor, capacity, status, amenities, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Allocate room to student
router.post('/allocate', authenticateToken, async (req, res) => {
  try {
    const { student_id, room_id } = req.body;

    // Check room availability
    const room = await pool.query(`
      SELECT r.*, COUNT(s.id) as current_count
      FROM rooms r
      LEFT JOIN students s ON r.id = s.room_id AND s.status = 'active'
      WHERE r.id = $1
      GROUP BY r.id
    `, [room_id]);

    if (room.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    if (parseInt(room.rows[0].current_count) >= room.rows[0].capacity) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Get student's current room
    const student = await pool.query('SELECT room_id FROM students WHERE id = $1', [student_id]);
    const oldRoomId = student.rows[0]?.room_id;

    // Update student's room
    await pool.query('UPDATE students SET room_id = $1 WHERE id = $2', [room_id, student_id]);

    // Update room occupancy
    if (oldRoomId && oldRoomId !== room_id) {
      await pool.query(
        'UPDATE rooms SET current_occupancy = GREATEST(0, current_occupancy - 1) WHERE id = $1',
        [oldRoomId]
      );
    }
    await pool.query(
      'UPDATE rooms SET current_occupancy = current_occupancy + 1 WHERE id = $1',
      [room_id]
    );

    res.json({ message: 'Room allocated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

