import { pool } from '../config/database.js';
import { verifyToken } from '../utils/jwt.js';
import { stripPassword } from '../utils/sanitize.js';

export const authenticateStudent = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Please sign in to continue' });
  }

  try {
    const decoded = verifyToken(token);

    if (decoded.typ === 'staff' || (decoded.role && decoded.role !== 'student')) {
      return res.status(403).json({ error: 'This page is for residents only' });
    }

    if (decoded.typ !== 'student' && !decoded.studentData) {
      return res.status(403).json({ error: 'Please sign in as a resident' });
    }

    pool.query(
      `SELECT s.id, s.student_id, s.first_name, s.last_name, s.email, s.phone, s.address, 
              s.date_of_birth, s.gender, s.course, s.year_of_study, s.room_id, s.status, 
              s.hostel_id, h.name as hostel_name
       FROM students s
       LEFT JOIN hostels h ON s.hostel_id = h.id
       WHERE s.id = $1`,
      [decoded.id]
    ).then((result) => {
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Resident account not found. Please sign in again.' });
      }

      req.student = stripPassword(result.rows[0]);
      req.student.role = 'student';
      next();
    }).catch(() => {
      return res.status(500).json({ error: 'Could not check your account. Please try again.' });
    });
  } catch (err) {
    return res.status(401).json({ error: 'Your session expired. Please sign in again.' });
  }
};
