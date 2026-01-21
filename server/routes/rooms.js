import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';

const router = express.Router();

// Helper function to update room status based on occupancy
const updateRoomStatus = async (roomId) => {
  try {
    const roomInfo = await pool.query(`
      SELECT r.capacity, r.status, COUNT(s.id) as occupancy_count
      FROM rooms r
      LEFT JOIN students s ON r.id = s.room_id AND s.status = 'active'
      WHERE r.id = $1
      GROUP BY r.id, r.capacity, r.status
    `, [roomId]);
    
    if (roomInfo.rows.length > 0) {
      const capacity = parseInt(roomInfo.rows[0].capacity || 0);
      const occupancy = parseInt(roomInfo.rows[0].occupancy_count || 0);
      const currentStatus = roomInfo.rows[0].status;
      
      // Preserve maintenance status if set
      if (currentStatus === 'maintenance') {
        await pool.query(
          'UPDATE rooms SET current_occupancy = $1 WHERE id = $2',
          [occupancy, roomId]
        );
        return;
      }
      
      // Calculate status based on occupancy
      let status = 'available';
      if (occupancy >= capacity && capacity > 0) {
        status = 'occupied';
      } else if (occupancy > 0 && occupancy < capacity) {
        status = 'partially_occupied';
      }
      
      await pool.query(
        'UPDATE rooms SET current_occupancy = $1, status = $2 WHERE id = $3',
        [occupancy, status, roomId]
      );
    }
  } catch (error) {
    console.error('Error updating room status:', error);
  }
};

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
    
    // Calculate status based on occupancy
    const roomsWithStatus = result.rows.map(room => {
      const occupancy = parseInt(room.current_occupancy_count || 0);
      const capacity = parseInt(room.capacity || 0);
      
      // Determine status based on occupancy
      let calculatedStatus = room.status;
      if (occupancy >= capacity && capacity > 0) {
        calculatedStatus = 'occupied';
      } else if (occupancy > 0 && occupancy < capacity) {
        calculatedStatus = 'partially_occupied';
      } else if (occupancy === 0) {
        calculatedStatus = 'available';
      }
      
      // Override with maintenance status if set
      if (room.status === 'maintenance') {
        calculatedStatus = 'maintenance';
      }
      
      return {
        ...room,
        status: calculatedStatus,
        display_status: calculatedStatus
      };
    });
    
    res.json(roomsWithStatus);
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

    // Check if room number already exists in this hostel
    const existingRoom = await pool.query(
      `SELECT id FROM rooms WHERE hostel_id = $1 AND room_number = $2`,
      [finalHostelId, room_number]
    );

    if (existingRoom.rows.length > 0) {
      return res.status(400).json({ error: 'Room number already exists in this hostel' });
    }

    // Validate capacity against room type capacity
    if (room_type_id) {
      const roomType = await pool.query('SELECT capacity FROM room_types WHERE id = $1', [room_type_id]);
      if (roomType.rows.length > 0) {
        const maxCapacity = roomType.rows[0].capacity;
        if (parseInt(capacity) > maxCapacity) {
          return res.status(400).json({ 
            error: `Room capacity (${capacity}) cannot exceed the room type capacity of ${maxCapacity}` 
          });
        }
      }
    }

    const result = await pool.query(
      `INSERT INTO rooms (room_number, room_type_id, floor, capacity, status, amenities, hostel_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [room_number, room_type_id, floor, capacity, status || 'available', amenities || [], finalHostelId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Room number already exists in this hostel' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update room
router.put('/:id', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { room_number, room_type_id, floor, capacity, status, amenities } = req.body;

    // Get the current room to check hostel_id
    const currentRoom = await pool.query('SELECT hostel_id, room_type_id FROM rooms WHERE id = $1', [req.params.id]);
    
    if (currentRoom.rows.length === 0) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const hostelId = currentRoom.rows[0].hostel_id;
    const finalRoomTypeId = room_type_id || currentRoom.rows[0].room_type_id;

    // Check if room number already exists in this hostel (excluding current room)
    if (room_number) {
      const existingRoom = await pool.query(
        `SELECT id FROM rooms WHERE hostel_id = $1 AND room_number = $2 AND id != $3`,
        [hostelId, room_number, req.params.id]
      );

      if (existingRoom.rows.length > 0) {
        return res.status(400).json({ error: 'Room number already exists in this hostel' });
      }
    }

    // Validate capacity against room type capacity
    if (finalRoomTypeId && capacity) {
      const roomType = await pool.query('SELECT capacity FROM room_types WHERE id = $1', [finalRoomTypeId]);
      if (roomType.rows.length > 0) {
        const maxCapacity = roomType.rows[0].capacity;
        if (parseInt(capacity) > maxCapacity) {
          return res.status(400).json({ 
            error: `Room capacity (${capacity}) cannot exceed the room type capacity of ${maxCapacity}` 
          });
        }
      }
    }

    // Update room
    const result = await pool.query(
      `UPDATE rooms SET room_number = $1, room_type_id = $2, floor = $3, 
       capacity = $4, amenities = $5 WHERE id = $6 RETURNING *`,
      [room_number, room_type_id, floor, capacity, amenities, req.params.id]
    );

    // Recalculate status based on occupancy if status is not explicitly set to maintenance
    if (status !== 'maintenance') {
      const occupancyInfo = await pool.query(`
        SELECT COUNT(s.id) as occupancy_count
        FROM rooms r
        LEFT JOIN students s ON r.id = s.room_id AND s.status = 'active'
        WHERE r.id = $1
        GROUP BY r.id
      `, [req.params.id]);
      
      const occupancy = parseInt(occupancyInfo.rows[0]?.occupancy_count || 0);
      const roomCapacity = parseInt(capacity || 0);
      
      let calculatedStatus = 'available';
      if (occupancy >= roomCapacity && roomCapacity > 0) {
        calculatedStatus = 'occupied';
      } else if (occupancy > 0 && occupancy < roomCapacity) {
        calculatedStatus = 'partially_occupied';
      }
      
      // Update with calculated status
      await pool.query(
        'UPDATE rooms SET status = $1 WHERE id = $2',
        [calculatedStatus, req.params.id]
      );
      
      result.rows[0].status = calculatedStatus;
    } else {
      // If maintenance, keep it as is
      await pool.query(
        'UPDATE rooms SET status = $1 WHERE id = $2',
        [status, req.params.id]
      );
      result.rows[0].status = status;
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Room number already exists in this hostel' });
    }
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

    // Update room status for both old and new rooms
    if (oldRoomId && oldRoomId !== room_id) {
      await updateRoomStatus(oldRoomId);
    }
    
    // Update new room status
    await updateRoomStatus(room_id);

    res.json({ message: 'Room allocated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

