import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';

const router = express.Router();

// Get all inventory items
router.get('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    let query = 'SELECT * FROM inventory WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    if (req.query.category) {
      query += ` AND category = $${paramCount++}`;
      params.push(req.query.category);
    }

    if (req.query.location) {
      query += ` AND location = $${paramCount++}`;
      params.push(req.query.location);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory item by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM inventory WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create inventory item
router.post('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const {
      item_name, category, quantity, unit, location, condition,
      purchase_date, purchase_price, supplier, hostel_id
    } = req.body;

    const finalHostelId = hostel_id || req.hostelId;
    if (!finalHostelId) {
      return res.status(400).json({ error: 'Hostel ID is required' });
    }

    const result = await pool.query(
      `INSERT INTO inventory (item_name, category, quantity, unit, location, condition,
       purchase_date, purchase_price, supplier, hostel_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [item_name, category, quantity, unit, location, condition,
       purchase_date, purchase_price, supplier, finalHostelId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inventory item
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      item_name, category, quantity, unit, location, condition,
      purchase_date, purchase_price, supplier
    } = req.body;

    const result = await pool.query(
      `UPDATE inventory SET item_name = $1, category = $2, quantity = $3, unit = $4,
       location = $5, condition = $6, purchase_date = $7, purchase_price = $8,
       supplier = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [item_name, category, quantity, unit, location, condition,
       purchase_date, purchase_price, supplier, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete inventory item
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM inventory WHERE id = $1', [req.params.id]);
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock items
router.get('/alerts/low-stock', authenticateToken, setHostelContext, async (req, res) => {
  try {
    let query = `
      SELECT * FROM inventory
      WHERE quantity < 10 AND hostel_id = $1
      ORDER BY quantity ASC
    `;
    const params = [req.hostelId || req.query.hostel_id];

    if (req.user.role === 'super_admin' && req.query.hostel_id) {
      params[0] = req.query.hostel_id;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

