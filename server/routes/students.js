import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';
import { checkEmailExists, isValidEmailFormat } from '../utils/emailValidation.js';

const router = express.Router();

// Get all students
router.get('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    let query = `
      SELECT s.*, r.room_number, rt.type_name as room_type
      FROM students s
      LEFT JOIN rooms r ON s.room_id = r.id
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by hostel_id if not super admin or if hostel_id is specified
    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND s.hostel_id = $1`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    query += ` ORDER BY s.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get student by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, r.room_number, rt.type_name as room_type
      FROM students s
      LEFT JOIN rooms r ON s.room_id = r.id
      LEFT JOIN room_types rt ON r.room_type_id = rt.id
      WHERE s.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create student
router.post('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const {
      student_id, first_name, last_name, email, phone, address,
      date_of_birth, gender, course, year_of_study, room_id, status, hostel_id
    } = req.body;

    // Use provided hostel_id or default to user's hostel
    const finalHostelId = hostel_id || req.hostelId;

    if (!finalHostelId) {
      return res.status(400).json({ error: 'Hostel ID is required' });
    }

    // Validate required fields
    if (!student_id || !first_name || !last_name || !email) {
      return res.status(400).json({ error: 'Student ID, First Name, Last Name, and Email are required fields' });
    }

    // Validate email format
    if (!isValidEmailFormat(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if email already exists in any table
    const emailCheck = await checkEmailExists(email);
    if (emailCheck.exists) {
      return res.status(400).json({ error: emailCheck.message });
    }

    // Convert empty date strings to null
    const normalizedDateOfBirth = (date_of_birth && date_of_birth.trim() !== '') ? date_of_birth : null;
    
    // Validate date format if provided
    if (normalizedDateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(normalizedDateOfBirth)) {
        return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD format' });
      }
      // Check if date is valid
      const date = new Date(normalizedDateOfBirth);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid date. Please enter a valid date of birth' });
      }
    }

    const result = await pool.query(
      `INSERT INTO students (student_id, first_name, last_name, email, phone, address, 
       date_of_birth, gender, course, year_of_study, room_id, status, hostel_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [student_id, first_name, last_name, email, phone || null, address || null,
       normalizedDateOfBirth, gender || null, course || null, year_of_study || null, 
       room_id || null, status || 'active', finalHostelId]
    );

    // Update room occupancy if room_id is provided
    if (room_id) {
      await pool.query(
        'UPDATE rooms SET current_occupancy = current_occupancy + 1 WHERE id = $1',
        [room_id]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Student ID or email already exists' });
    }
    // Handle date-related errors with user-friendly messages
    if (error.message && error.message.includes('date')) {
      return res.status(400).json({ 
        error: 'Invalid date format. Please enter a valid date of birth or leave it empty.' 
      });
    }
    // Handle other database errors
    console.error('Error creating student:', error);
    res.status(500).json({ 
      error: error.message || 'An error occurred while creating the student. Please try again.' 
    });
  }
});

// Update student
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone, address,
      date_of_birth, gender, course, year_of_study, room_id, status
    } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First Name, Last Name, and Email are required fields' });
    }

    // Validate email format
    if (!isValidEmailFormat(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Check if email already exists in any table (excluding current student)
    const emailCheck = await checkEmailExists(email, null, req.params.id);
    if (emailCheck.exists) {
      return res.status(400).json({ error: emailCheck.message });
    }

    // Convert empty date strings to null
    const normalizedDateOfBirth = (date_of_birth && date_of_birth.trim() !== '') ? date_of_birth : null;
    
    // Validate date format if provided
    if (normalizedDateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(normalizedDateOfBirth)) {
        return res.status(400).json({ error: 'Invalid date format. Please use YYYY-MM-DD format' });
      }
      // Check if date is valid
      const date = new Date(normalizedDateOfBirth);
      if (isNaN(date.getTime())) {
        return res.status(400).json({ error: 'Invalid date. Please enter a valid date of birth' });
      }
    }

    // Get old room_id
    const oldStudent = await pool.query('SELECT room_id FROM students WHERE id = $1', [req.params.id]);
    const oldRoomId = oldStudent.rows[0]?.room_id;

    const result = await pool.query(
      `UPDATE students SET first_name = $1, last_name = $2, email = $3, phone = $4, 
       address = $5, date_of_birth = $6, gender = $7, course = $8, year_of_study = $9, 
       room_id = $10, status = $11, updated_at = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [first_name, last_name, email, phone || null, address || null, normalizedDateOfBirth, 
       gender || null, course || null, year_of_study || null, room_id || null, status, req.params.id]
    );

    // Update room status for both old and new rooms
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

    if (oldRoomId && oldRoomId !== room_id) {
      await updateRoomStatus(oldRoomId);
    }
    if (room_id && oldRoomId !== room_id) {
      await updateRoomStatus(room_id);
    }

    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Student ID or email already exists' });
    }
    // Handle date-related errors with user-friendly messages
    if (error.message && error.message.includes('date')) {
      return res.status(400).json({ 
        error: 'Invalid date format. Please enter a valid date of birth or leave it empty.' 
      });
    }
    // Handle other database errors
    console.error('Error updating student:', error);
    res.status(500).json({ 
      error: error.message || 'An error occurred while updating the student. Please try again.' 
    });
  }
});

// Delete student
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const student = await pool.query('SELECT room_id FROM students WHERE id = $1', [req.params.id]);
    const roomId = student.rows[0]?.room_id;

    await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);

    // Update room status
    if (roomId) {
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
      
      await updateRoomStatus(roomId);
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

