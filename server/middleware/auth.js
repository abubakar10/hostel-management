import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here', async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Fetch full user data including hostel_id
    try {
      const { pool } = await import('../config/database.js');
      const result = await pool.query('SELECT id, username, email, role, hostel_id FROM users WHERE id = $1', [decoded.id]);
      
      if (result.rows.length === 0) {
        return res.status(403).json({ error: 'User not found' });
      }
      
      req.user = result.rows[0];
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching user data' });
    }
  });
};

