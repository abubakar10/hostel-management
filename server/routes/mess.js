import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';

const router = express.Router();

// ========== MESS MENU ROUTES ==========

// Get all menus
router.get('/menu', authenticateToken, setHostelContext, async (req, res) => {
  try {
    let query = 'SELECT * FROM mess_menu WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    if (req.query.date) {
      query += ` AND date = $${paramCount++}`;
      params.push(req.query.date);
    }

    if (req.query.meal_type) {
      query += ` AND meal_type = $${paramCount++}`;
      params.push(req.query.meal_type);
    }

    query += ' ORDER BY date DESC, meal_type';

    const result = await pool.query(query, params);
    
    // Parse menu_items if it's stored as JSON string
    const menus = result.rows.map(row => ({
      ...row,
      menu_items: typeof row.menu_items === 'string' 
        ? (row.menu_items.startsWith('[') ? JSON.parse(row.menu_items) : row.menu_items.split(',').map(item => item.trim()))
        : Array.isArray(row.menu_items) ? row.menu_items : []
    }));
    
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create menu
router.post('/menu', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { date, meal_type, menu_items, hostel_id } = req.body;

    const finalHostelId = hostel_id || req.hostelId;
    if (!finalHostelId) {
      return res.status(400).json({ error: 'Hostel ID is required' });
    }

    const result = await pool.query(
      `INSERT INTO mess_menu (hostel_id, date, meal_type, menu_items)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [finalHostelId, date, meal_type, menu_items]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Menu already exists for this date and meal type' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update menu
router.put('/menu/:id', authenticateToken, async (req, res) => {
  try {
    const { menu_items } = req.body;

    const result = await pool.query(
      `UPDATE mess_menu SET menu_items = $1 WHERE id = $2 RETURNING *`,
      [menu_items, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Menu not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete menu
router.delete('/menu/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM mess_menu WHERE id = $1', [req.params.id]);
    res.json({ message: 'Menu deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== MEAL ATTENDANCE ROUTES ==========

// Get meal attendance
router.get('/attendance', authenticateToken, setHostelContext, async (req, res) => {
  try {
    let query = `
      SELECT m.*, s.first_name, s.last_name, s.student_id
      FROM meal_attendance m
      LEFT JOIN students s ON m.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND m.hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    if (req.query.date) {
      query += ` AND m.date = $${paramCount++}`;
      params.push(req.query.date);
    }

    if (req.query.meal_type) {
      query += ` AND m.meal_type = $${paramCount++}`;
      params.push(req.query.meal_type);
    }

    query += ' ORDER BY m.date DESC, m.meal_type';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Update meal attendance
router.post('/attendance', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { student_id, date, meal_type, status, hostel_id } = req.body;

    const finalHostelId = hostel_id || req.hostelId;
    if (!finalHostelId) {
      return res.status(400).json({ error: 'Hostel ID is required' });
    }

    // Use INSERT ... ON CONFLICT to handle duplicates
    const result = await pool.query(
      `INSERT INTO meal_attendance (student_id, date, meal_type, status, hostel_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id, date, meal_type)
       DO UPDATE SET status = $4
       RETURNING *`,
      [student_id, date, meal_type, status || 'present', finalHostelId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk meal attendance
router.post('/attendance/bulk', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { date, meal_type, records, hostel_id } = req.body;

    const finalHostelId = hostel_id || req.hostelId;
    if (!finalHostelId) {
      return res.status(400).json({ error: 'Hostel ID is required' });
    }

    const results = [];
    for (const record of records) {
      const result = await pool.query(
        `INSERT INTO meal_attendance (student_id, date, meal_type, status, hostel_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id, date, meal_type)
         DO UPDATE SET status = $4
         RETURNING *`,
        [record.student_id, date, meal_type, record.status || 'present', finalHostelId]
      );
      results.push(result.rows[0]);
    }

    res.status(201).json({ message: 'Meal attendance recorded', records: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== MESS FEES ROUTES ==========

// Get mess fees (read from fees table where fee_type = 'mess')
router.get('/fees', authenticateToken, setHostelContext, async (req, res) => {
  try {
    let query = `
      SELECT 
        f.*,
        s.first_name, 
        s.last_name, 
        s.student_id,
        EXTRACT(MONTH FROM f.due_date)::INTEGER as month,
        EXTRACT(YEAR FROM f.due_date)::INTEGER as year
      FROM fees f
      LEFT JOIN students s ON f.student_id = s.id
      WHERE f.fee_type = 'mess'
    `;
    const params = [];
    let paramCount = 1;

    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND f.hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    if (req.query.month) {
      query += ` AND EXTRACT(MONTH FROM f.due_date) = $${paramCount++}`;
      params.push(req.query.month);
    }

    if (req.query.year) {
      query += ` AND EXTRACT(YEAR FROM f.due_date) = $${paramCount++}`;
      params.push(req.query.year);
    }

    if (req.query.status) {
      query += ` AND f.status = $${paramCount++}`;
      params.push(req.query.status);
    }

    query += ' ORDER BY f.due_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update mess fee (mark as paid) - update in fees table
router.put('/fees/:id', authenticateToken, async (req, res) => {
  try {
    const { status, paid_date } = req.body;

    const result = await pool.query(
      `UPDATE fees 
       SET status = $1, paid_date = $2 
       WHERE id = $3 AND fee_type = 'mess' 
       RETURNING *`,
      [status || 'paid', paid_date || new Date().toISOString().split('T')[0], req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mess fee not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete mess fee - delete from fees table
router.delete('/fees/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM fees WHERE id = $1 AND fee_type = \'mess\' RETURNING *',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Mess fee not found' });
    }
    
    res.json({ message: 'Mess fee deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

