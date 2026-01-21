import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';

const router = express.Router();

// Get all room transfer requests
router.get('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    let query = `
      SELECT t.*, s.first_name as student_first_name, s.last_name as student_last_name,
             s.student_id, r1.room_number as from_room, r2.room_number as to_room,
             u.username as approved_by_name
      FROM room_transfers t
      LEFT JOIN students s ON t.student_id = s.id
      LEFT JOIN rooms r1 ON t.from_room_id = r1.id
      LEFT JOIN rooms r2 ON t.to_room_id = r2.id
      LEFT JOIN users u ON t.approved_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND t.hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    if (req.query.status) {
      query += ` AND t.status = $${paramCount++}`;
      params.push(req.query.status);
    }

    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transfer request by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, s.first_name as student_first_name, s.last_name as student_last_name,
             s.student_id, r1.room_number as from_room, r2.room_number as to_room,
             u.username as approved_by_name
      FROM room_transfers t
      LEFT JOIN students s ON t.student_id = s.id
      LEFT JOIN rooms r1 ON t.from_room_id = r1.id
      LEFT JOIN rooms r2 ON t.to_room_id = r2.id
      LEFT JOIN users u ON t.approved_by = u.id
      WHERE t.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transfer request not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create room transfer request
router.post('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const {
      student_id, from_room_id, to_room_id, reason, hostel_id
    } = req.body;

    const finalHostelId = hostel_id || req.hostelId;
    if (!finalHostelId) {
      return res.status(400).json({ error: 'Hostel ID is required' });
    }

    // Check if to_room has available space
    const roomCheck = await pool.query(
      'SELECT capacity, current_occupancy FROM rooms WHERE id = $1',
      [to_room_id]
    );

    if (roomCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Destination room not found' });
    }

    const room = roomCheck.rows[0];
    if (room.current_occupancy >= room.capacity) {
      return res.status(400).json({ error: 'Destination room is full' });
    }

    const result = await pool.query(
      `INSERT INTO room_transfers (student_id, from_room_id, to_room_id, reason, status, hostel_id)
       VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING *`,
      [student_id, from_room_id, to_room_id, reason, finalHostelId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update transfer request (approve/reject)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, transfer_date } = req.body;

    // Get transfer details
    const transfer = await pool.query('SELECT * FROM room_transfers WHERE id = $1', [req.params.id]);
    
    if (transfer.rows.length === 0) {
      return res.status(404).json({ error: 'Transfer request not found' });
    }

    const transferData = transfer.rows[0];

    // If approving, update room occupancy and status
    if (status === 'approved') {
      // Update student's room_id
      await pool.query(
        'UPDATE students SET room_id = $1 WHERE id = $2',
        [transferData.to_room_id, transferData.student_id]
      );

      // Helper function to update room status
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

      // Update status for both from_room and to_room
      if (transferData.from_room_id) {
        await updateRoomStatus(transferData.from_room_id);
      }
      await updateRoomStatus(transferData.to_room_id);
    }

    // Update transfer request
    const result = await pool.query(
      `UPDATE room_transfers SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP,
       transfer_date = $3 WHERE id = $4 RETURNING *`,
      [status, req.user.id, transfer_date || new Date().toISOString().split('T')[0], req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transfer request
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM room_transfers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Transfer request deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

