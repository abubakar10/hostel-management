import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

export const authenticateStudent = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here', async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Check if it's a student token
    if (!decoded.studentData || decoded.role !== 'student') {
      return res.status(403).json({ error: 'Student access required' });
    }
    
    // Fetch full student data
    try {
      const result = await pool.query(
        `SELECT s.id, s.student_id, s.first_name, s.last_name, s.email, s.phone, s.address, 
                s.date_of_birth, s.gender, s.course, s.year_of_study, s.room_id, s.status, 
                s.hostel_id, h.name as hostel_name
         FROM students s
         LEFT JOIN hostels h ON s.hostel_id = h.id
         WHERE s.id = $1`,
        [decoded.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Student not found' });
      }
      
      req.student = result.rows[0];
      req.student.role = 'student';
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching student data' });
    }
  });
};

