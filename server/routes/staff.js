import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';

const router = express.Router();

// Get all staff
router.get('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { role, status } = req.query;
    let query = 'SELECT * FROM staff WHERE 1=1';
    const params = [];
    let paramCount = 1;

    // Filter by hostel_id
    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    if (role) {
      query += ` AND role = $${paramCount++}`;
      params.push(role);
    }
    if (status) {
      query += ` AND status = $${paramCount++}`;
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get staff by role
router.get('/role/:role', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM staff WHERE role = $1 AND status = $2 ORDER BY first_name',
      [req.params.role, 'active']
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create staff
router.post('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const {
      staff_id, first_name, last_name, email, phone, role, shift, salary, hire_date, status, hostel_id
    } = req.body;

    // Validate required fields
    if (!staff_id || staff_id.toString().trim() === '') {
      return res.status(400).json({ error: 'Staff ID is required' });
    }
    if (!first_name || first_name.trim() === '') {
      return res.status(400).json({ error: 'First name is required' });
    }
    if (!last_name || last_name.trim() === '') {
      return res.status(400).json({ error: 'Last name is required' });
    }
    if (!email || email.trim() === '') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate salary if provided
    let salaryValue = null;
    if (salary !== null && salary !== undefined && salary.toString().trim() !== '') {
      salaryValue = parseFloat(salary);
      if (isNaN(salaryValue) || salaryValue < 0) {
        return res.status(400).json({ error: 'Salary must be a valid positive number' });
      }
    }

    // Validate hire_date if provided
    let hireDateValue = null;
    if (hire_date !== null && hire_date !== undefined && hire_date.toString().trim() !== '') {
      const dateValue = new Date(hire_date);
      if (isNaN(dateValue.getTime())) {
        return res.status(400).json({ error: 'Hire date must be a valid date' });
      }
      hireDateValue = hire_date;
    }

    const finalHostelId = hostel_id || req.hostelId;
    if (!finalHostelId) {
      return res.status(400).json({ error: 'Hostel ID is required' });
    }

    const result = await pool.query(
      `INSERT INTO staff (staff_id, first_name, last_name, email, phone, role, shift, salary, hire_date, status, hostel_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [staff_id, first_name, last_name, email, phone || null, role, shift || null, salaryValue, hireDateValue, status || 'active', finalHostelId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Staff ID or email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update staff
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      first_name, last_name, email, phone, role, shift, salary, hire_date, status
    } = req.body;

    // Validate required fields
    if (!first_name || first_name.trim() === '') {
      return res.status(400).json({ error: 'First name is required' });
    }
    if (!last_name || last_name.trim() === '') {
      return res.status(400).json({ error: 'Last name is required' });
    }
    if (!email || email.trim() === '') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Validate salary if provided
    let salaryValue = null;
    if (salary !== null && salary !== undefined && salary.toString().trim() !== '') {
      salaryValue = parseFloat(salary);
      if (isNaN(salaryValue) || salaryValue < 0) {
        return res.status(400).json({ error: 'Salary must be a valid positive number' });
      }
    }

    // Validate hire_date if provided
    let hireDateValue = null;
    if (hire_date !== null && hire_date !== undefined && hire_date.toString().trim() !== '') {
      const dateValue = new Date(hire_date);
      if (isNaN(dateValue.getTime())) {
        return res.status(400).json({ error: 'Hire date must be a valid date' });
      }
      hireDateValue = hire_date;
    }

    const result = await pool.query(
      `UPDATE staff SET first_name = $1, last_name = $2, email = $3, phone = $4, 
       role = $5, shift = $6, salary = $7, hire_date = $8, status = $9
       WHERE id = $10 RETURNING *`,
      [first_name, last_name, email, phone || null, role, shift || null, salaryValue, hireDateValue, status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete staff
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM staff WHERE id = $1', [req.params.id]);
    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

