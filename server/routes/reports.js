import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';

const router = express.Router();

router.get('/overview', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const hostelId = req.query.hostel_id || req.hostelId;
    const hostelFilter = hostelId ? 'AND hostel_id = $1' : '';
    const params = hostelId ? [hostelId] : [];
    const today = new Date().toISOString().split('T')[0];

    const [students, rooms, fees, complaints, maintenance, attendance] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM students WHERE status = 'active' ${hostelFilter}`, params),
      pool.query(
        `SELECT COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE current_occupancy > 0)::int AS occupied,
                COALESCE(SUM(capacity), 0)::int AS capacity,
                COALESCE(SUM(current_occupancy), 0)::int AS filled
         FROM rooms WHERE 1=1 ${hostelFilter}`,
        params
      ),
      pool.query(
        `SELECT
           COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)::float AS paid,
           COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)::float AS pending,
           COALESCE(SUM(amount) FILTER (WHERE status IN ('pending','overdue') AND due_date < CURRENT_DATE), 0)::float AS overdue
         FROM fees WHERE 1=1 ${hostelFilter}`,
        params
      ),
      pool.query(`SELECT COUNT(*)::int AS count FROM complaints WHERE status = 'open' ${hostelFilter}`, params),
      pool.query(`SELECT COUNT(*)::int AS count FROM maintenance_requests WHERE status = 'pending' ${hostelFilter}`, params)
        .catch(() => ({ rows: [{ count: 0 }] })),
      pool.query(
        hostelId
          ? `SELECT COUNT(*)::int AS marked, COUNT(*) FILTER (WHERE status = 'present')::int AS present FROM attendance WHERE hostel_id = $1 AND date = $2`
          : `SELECT COUNT(*)::int AS marked, COUNT(*) FILTER (WHERE status = 'present')::int AS present FROM attendance WHERE date = $1`,
        hostelId ? [hostelId, today] : [today]
      )
    ]);

    const room = rooms.rows[0];
    const occupancyRate = room.capacity > 0 ? Math.round((room.filled / room.capacity) * 100) : 0;
    const att = attendance.rows[0];
    const attendanceRate = att.marked > 0 ? Math.round((att.present / att.marked) * 100) : 0;

    const recentPeople = await pool.query(
      `SELECT first_name, last_name, created_at FROM students WHERE 1=1 ${hostelFilter} ORDER BY created_at DESC LIMIT 5`,
      params
    );
    const openProblems = await pool.query(
      `SELECT title, created_at FROM complaints WHERE status = 'open' ${hostelFilter} ORDER BY created_at DESC LIMIT 5`,
      params
    );
    const dueSoon = await pool.query(
      `SELECT f.amount, f.due_date, s.first_name, s.last_name
       FROM fees f JOIN students s ON f.student_id = s.id
       WHERE f.status = 'pending' AND f.due_date >= CURRENT_DATE AND f.due_date <= CURRENT_DATE + INTERVAL '7 days'
       ${hostelId ? 'AND f.hostel_id = $1' : ''}
       ORDER BY f.due_date ASC LIMIT 5`,
      params
    );
    const topPending = await pool.query(
      `SELECT s.first_name, s.last_name, SUM(f.amount)::float AS amount, COUNT(*)::int AS count
       FROM fees f JOIN students s ON f.student_id = s.id
       WHERE f.status = 'pending' ${hostelId ? 'AND f.hostel_id = $1' : ''}
       GROUP BY s.id, s.first_name, s.last_name
       ORDER BY amount DESC LIMIT 5`,
      params
    );

    res.json({
      students: students.rows[0].count,
      totalRooms: room.total,
      occupiedRooms: room.occupied,
      occupancyRate,
      totalFees: fees.rows[0].paid,
      pendingFees: fees.rows[0].pending,
      overdueFees: fees.rows[0].overdue,
      complaints: complaints.rows[0].count,
      maintenance: maintenance.rows[0].count,
      attendanceRate,
      recentPeople: recentPeople.rows,
      openProblems: openProblems.rows,
      dueSoon: dueSoon.rows,
      topPending: topPending.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not load the home numbers' });
  }
});

// Monthly Income & Expenses
router.get('/income-expenses/:year/:month', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { year, month } = req.params;
    const hostelId = req.query.hostel_id || req.hostelId;

    // Income from fees
    let incomeQuery = `
      SELECT 
        SUM(CASE WHEN fee_type = 'hostel' AND status = 'paid' THEN amount ELSE 0 END) as hostel_income,
        SUM(CASE WHEN fee_type = 'mess' AND status = 'paid' THEN amount ELSE 0 END) as mess_income,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_income
      FROM fees
      WHERE EXTRACT(YEAR FROM paid_date) = $1 
        AND EXTRACT(MONTH FROM paid_date) = $2
    `;
    const incomeParams = [year, month];
    if (hostelId) {
      incomeQuery += ` AND hostel_id = $3`;
      incomeParams.push(hostelId);
    }
    const income = await pool.query(incomeQuery, incomeParams);

    // Expenses
    let expensesQuery = `
      SELECT 
        SUM(amount) as total_expenses,
        category,
        SUM(amount) as category_total
      FROM expenses
      WHERE EXTRACT(YEAR FROM date) = $1 
        AND EXTRACT(MONTH FROM date) = $2
    `;
    const expensesParams = [year, month];
    if (hostelId) {
      expensesQuery += ` AND hostel_id = $3`;
      expensesParams.push(hostelId);
    }
    expensesQuery += ` GROUP BY category`;
    const expenses = await pool.query(expensesQuery, expensesParams);

    // Staff salaries
    let salariesQuery = `
      SELECT SUM(salary) as total_salaries
      FROM staff
      WHERE status = 'active'
    `;
    const salariesParams = [];
    if (hostelId) {
      salariesQuery += ` AND hostel_id = $1`;
      salariesParams.push(hostelId);
    }
    const salaries = await pool.query(salariesQuery, salariesParams);

    res.json({
      income: income.rows[0],
      expenses: expenses.rows,
      salaries: salaries.rows[0],
      net: {
        total_income: parseFloat(income.rows[0].total_income || 0),
        total_expenses: parseFloat(expenses.rows.reduce((sum, e) => sum + parseFloat(e.category_total || 0), 0)) + parseFloat(salaries.rows[0].total_salaries || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profit/Loss Analysis
router.get('/profit-loss/:year', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { year } = req.params;
    const hostelId = req.query.hostel_id || req.hostelId;

    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      let incomeQuery = `
        SELECT SUM(amount) as total
        FROM fees
        WHERE EXTRACT(YEAR FROM paid_date) = $1 
          AND EXTRACT(MONTH FROM paid_date) = $2
          AND status = 'paid'
      `;
      const incomeParams = [year, month];
      if (hostelId) {
        incomeQuery += ` AND hostel_id = $3`;
        incomeParams.push(hostelId);
      }
      const income = await pool.query(incomeQuery, incomeParams);

      let expensesQuery = `
        SELECT SUM(amount) as total
        FROM expenses
        WHERE EXTRACT(YEAR FROM date) = $1 
          AND EXTRACT(MONTH FROM date) = $2
      `;
      const expensesParams = [year, month];
      if (hostelId) {
        expensesQuery += ` AND hostel_id = $3`;
        expensesParams.push(hostelId);
      }
      const expenses = await pool.query(expensesQuery, expensesParams);

      let salariesQuery = `
        SELECT SUM(salary) as total
        FROM staff
        WHERE status = 'active'
      `;
      const salariesParams = [];
      if (hostelId) {
        salariesQuery += ` AND hostel_id = $1`;
        salariesParams.push(hostelId);
      }
      const salaries = await pool.query(salariesQuery, salariesParams);

      const totalIncome = parseFloat(income.rows[0].total || 0);
      const totalExpenses = parseFloat(expenses.rows[0].total || 0) + parseFloat(salaries.rows[0].total || 0);
      const profit = totalIncome - totalExpenses;

      monthlyData.push({
        month,
        income: totalIncome,
        expenses: totalExpenses,
        profit,
        profit_percentage: totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(2) : 0
      });
    }

    res.json(monthlyData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Category Breakdown
router.get('/category-breakdown/:year/:month', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { year, month } = req.params;
    const hostelId = req.query.hostel_id || req.hostelId;

    // Fee categories
    let feeCategoriesQuery = `
      SELECT fee_type as category, SUM(amount) as amount
      FROM fees
      WHERE EXTRACT(YEAR FROM paid_date) = $1 
        AND EXTRACT(MONTH FROM paid_date) = $2
        AND status = 'paid'
    `;
    const feeCategoriesParams = [year, month];
    if (hostelId) {
      feeCategoriesQuery += ` AND hostel_id = $3`;
      feeCategoriesParams.push(hostelId);
    }
    feeCategoriesQuery += ` GROUP BY fee_type`;
    const feeCategories = await pool.query(feeCategoriesQuery, feeCategoriesParams);

    // Expense categories
    let expenseCategoriesQuery = `
      SELECT category, SUM(amount) as amount
      FROM expenses
      WHERE EXTRACT(YEAR FROM date) = $1 
        AND EXTRACT(MONTH FROM date) = $2
    `;
    const expenseCategoriesParams = [year, month];
    if (hostelId) {
      expenseCategoriesQuery += ` AND hostel_id = $3`;
      expenseCategoriesParams.push(hostelId);
    }
    expenseCategoriesQuery += ` GROUP BY category`;
    const expenseCategories = await pool.query(expenseCategoriesQuery, expenseCategoriesParams);

    res.json({
      income: feeCategories.rows,
      expenses: expenseCategories.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Monthly Comparisons
router.get('/monthly-comparison/:year', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { year } = req.params;
    const hostelId = req.query.hostel_id || req.hostelId;
    const comparison = [];

    for (let month = 1; month <= 12; month++) {
      let incomeQuery = `
        SELECT SUM(amount) as total
        FROM fees
        WHERE EXTRACT(YEAR FROM paid_date) = $1 
          AND EXTRACT(MONTH FROM paid_date) = $2
          AND status = 'paid'
      `;
      const incomeParams = [year, month];
      if (hostelId) {
        incomeQuery += ` AND hostel_id = $3`;
        incomeParams.push(hostelId);
      }
      const income = await pool.query(incomeQuery, incomeParams);

      let expensesQuery = `
        SELECT SUM(amount) as total
        FROM expenses
        WHERE EXTRACT(YEAR FROM date) = $1 
          AND EXTRACT(MONTH FROM date) = $2
      `;
      const expensesParams = [year, month];
      if (hostelId) {
        expensesQuery += ` AND hostel_id = $3`;
        expensesParams.push(hostelId);
      }
      const expenses = await pool.query(expensesQuery, expensesParams);

      comparison.push({
        month,
        income: parseFloat(income.rows[0].total || 0),
        expenses: parseFloat(expenses.rows[0].total || 0)
      });
    }

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add expense
router.post('/expenses', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const { category, description, amount, date, payment_method } = req.body;
    const hostelId = req.body.hostel_id || req.hostelId;

    const result = await pool.query(
      `INSERT INTO expenses (category, description, amount, date, payment_method, hostel_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [category, description, amount, date, payment_method, hostelId || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Could not save the expense' });
  }
});

router.get('/expenses/all', authenticateToken, setHostelContext, async (req, res) => {
  try {
    const hostelId = req.query.hostel_id || req.hostelId;
    let query = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    if (hostelId) {
      query += ' AND hostel_id = $1';
      params.push(hostelId);
    }
    query += ' ORDER BY date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Could not load expenses' });
  }
});

export default router;

