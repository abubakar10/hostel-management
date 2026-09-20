import { pool } from '../config/database.js';
import { verifyToken } from '../utils/jwt.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Please sign in to continue' });
  }

  try {
    const decoded = verifyToken(token);

    if (decoded.typ === 'student' || decoded.role === 'student' || decoded.studentData) {
      return res.status(403).json({ error: 'This page is for hostel staff only' });
    }

    pool.query(
      'SELECT id, username, email, role, hostel_id FROM users WHERE id = $1',
      [decoded.id]
    ).then((result) => {
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'Account not found. Please sign in again.' });
      }
      req.user = result.rows[0];
      next();
    }).catch(() => {
      return res.status(500).json({ error: 'Could not check your account. Please try again.' });
    });
  } catch (err) {
    return res.status(401).json({ error: 'Your session expired. Please sign in again.' });
  }
};
