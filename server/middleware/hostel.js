import { pool } from '../config/database.js';

const ALLOWED_TABLES = new Set([
  'students',
  'rooms',
  'fees',
  'staff',
  'visitors',
  'leave_requests',
  'inventory',
  'complaints',
  'documents',
  'room_transfers',
  'maintenance_requests',
  'mess_menu'
]);

export const setHostelContext = (req, res, next) => {
  if (req.user.role === 'super_admin') {
    req.hostelId = req.query.hostel_id || req.body.hostel_id || req.user.hostel_id;
  } else {
    req.hostelId = req.user.hostel_id;
  }

  if (!req.hostelId && req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'No hostel is assigned to this account. Ask the owner to set it.' });
  }

  next();
};

export const requireHostelRecord = (table) => async (req, res, next) => {
  try {
    if (!ALLOWED_TABLES.has(table)) {
      return res.status(500).json({ error: 'Could not verify access' });
    }

    if (req.user?.role === 'super_admin') {
      return next();
    }

    const id = req.params.id;
    if (!id) return next();

    const result = await pool.query(`SELECT hostel_id FROM ${table} WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const recordHostelId = result.rows[0].hostel_id;
    if (recordHostelId != null && Number(recordHostelId) !== Number(req.user.hostel_id)) {
      return res.status(403).json({ error: 'You can only work with records from your own hostel' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Could not verify access' });
  }
};
