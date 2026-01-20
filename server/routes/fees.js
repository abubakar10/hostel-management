import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';

const router = express.Router();

// Get all fees
router.get('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { status, fee_type, student_id } = req.query;
    let query = `
      SELECT f.*, s.first_name, s.last_name, s.student_id as student_number
      FROM fees f
      JOIN students s ON f.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filter by hostel_id
    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND f.hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    if (status) {
      query += ` AND f.status = $${paramCount++}`;
      params.push(status);
    }
    if (fee_type) {
      query += ` AND f.fee_type = $${paramCount++}`;
      params.push(fee_type);
    }
    if (student_id) {
      query += ` AND f.student_id = $${paramCount++}`;
      params.push(student_id);
    }

    query += ' ORDER BY f.due_date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get fee by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, s.first_name, s.last_name, s.student_id as student_number
      FROM fees f
      JOIN students s ON f.student_id = s.id
      WHERE f.id = $1
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fee record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create fee
router.post('/', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { student_id, fee_type, amount, due_date, payment_method, hostel_id } = req.body;

    // Get student's hostel_id if not provided
    let finalHostelId = hostel_id || req.hostelId;
    if (!finalHostelId && student_id) {
      const student = await pool.query('SELECT hostel_id FROM students WHERE id = $1', [student_id]);
      if (student.rows.length > 0) {
        finalHostelId = student.rows[0].hostel_id;
      }
    }

    if (!finalHostelId) {
      return res.status(400).json({ error: 'Hostel ID is required' });
    }

    const receiptNumber = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const result = await pool.query(
      `INSERT INTO fees (student_id, fee_type, amount, due_date, payment_method, receipt_number, status, hostel_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [student_id, fee_type, amount, due_date, payment_method, receiptNumber, 'pending', finalHostelId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update fee (mark as paid)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { status, paid_date, payment_method } = req.body;

    const result = await pool.query(
      `UPDATE fees SET status = $1, paid_date = $2, payment_method = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 RETURNING *`,
      [status || 'paid', paid_date || new Date(), payment_method, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get receipts
router.get('/receipts/all', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.*, s.first_name, s.last_name, s.student_id as student_number
      FROM fees f
      JOIN students s ON f.student_id = s.id
      WHERE f.status = 'paid'
      ORDER BY f.paid_date DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get fee statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const totalFees = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
        SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as total_overdue,
        COUNT(*) as total_records
      FROM fees
    `);

    const byType = await pool.query(`
      SELECT fee_type, 
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending
      FROM fees
      GROUP BY fee_type
    `);

    res.json({
      overview: totalFees.rows[0],
      byType: byType.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get overdue fees
router.get('/overdue/list', authenticateToken, setHostelContext, async (req, res) => {
  try {
    let query = `
      SELECT f.*, s.first_name, s.last_name, s.student_id as student_number, s.email, s.phone
      FROM fees f
      JOIN students s ON f.student_id = s.id
      WHERE f.status IN ('pending', 'overdue')
      AND f.due_date < CURRENT_DATE
    `;
    const params = [];
    let paramCount = 1;

    // Filter by hostel_id
    if (req.user.role !== 'super_admin' || req.query.hostel_id) {
      query += ` AND f.hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.query.hostel_id);
    }

    query += ' ORDER BY f.due_date ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send payment reminders (creates notifications)
router.post('/reminders/send', authenticateToken, setHostelContext, async (req, res) => {
  try {
    let query = `
      SELECT f.*, s.first_name, s.last_name, s.student_id as student_number, s.email, s.phone
      FROM fees f
      JOIN students s ON f.student_id = s.id
      WHERE f.status IN ('pending', 'overdue')
      AND f.due_date < CURRENT_DATE
    `;
    const params = [];
    let paramCount = 1;

    // Filter by hostel_id
    if (req.user.role !== 'super_admin' || req.body.hostel_id) {
      query += ` AND f.hostel_id = $${paramCount++}`;
      params.push(req.hostelId || req.body.hostel_id);
    }

    const overdueFees = await pool.query(query, params);

    // Create notifications for each overdue fee
    const notifications = [];
    for (const fee of overdueFees.rows) {
      // Get student's user account if exists
      const userResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [fee.email]
      );

      if (userResult.rows.length > 0) {
        const notification = await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, related_module, is_read)
           VALUES ($1, $2, $3, 'reminder', 'fees', false)
           RETURNING *`,
          [
            userResult.rows[0].id,
            'Payment Reminder',
            `Your ${fee.fee_type} fee of RS ${fee.amount} was due on ${new Date(fee.due_date).toLocaleDateString()}. Please make payment as soon as possible.`
          ]
        );
        notifications.push(notification.rows[0]);
      }
    }

    res.json({
      message: `Reminders sent to ${notifications.length} students`,
      notifications: notifications.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

