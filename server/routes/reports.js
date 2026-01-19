import express from 'express';
import { pool } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { setHostelContext } from '../middleware/hostel.js';

const router = express.Router();

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
    if (hostelId && req.user.role !== 'super_admin') {
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
    if (hostelId && req.user.role !== 'super_admin') {
      expensesQuery += ` AND hostel_id = $3`;
      expensesParams.push(hostelId);
    }
    expensesQuery += ` GROUP BY category`;
    const expenses = await pool.query(expensesQuery, expensesParams);

    // Staff salaries
    const salaries = await pool.query(`
      SELECT SUM(salary) as total_salaries
      FROM staff
      WHERE status = 'active'
    `);

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
router.get('/profit-loss/:year', authenticateToken, async (req, res) => {
  try {
    const { year } = req.params;

    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      const income = await pool.query(`
        SELECT SUM(amount) as total
        FROM fees
        WHERE EXTRACT(YEAR FROM paid_date) = $1 
          AND EXTRACT(MONTH FROM paid_date) = $2
          AND status = 'paid'
      `, [year, month]);

      const expenses = await pool.query(`
        SELECT SUM(amount) as total
        FROM expenses
        WHERE EXTRACT(YEAR FROM date) = $1 
          AND EXTRACT(MONTH FROM date) = $2
      `, [year, month]);

      const salaries = await pool.query(`
        SELECT SUM(salary) as total
        FROM staff
        WHERE status = 'active'
      `);

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
router.get('/category-breakdown/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;

    // Fee categories
    const feeCategories = await pool.query(`
      SELECT fee_type as category, SUM(amount) as amount
      FROM fees
      WHERE EXTRACT(YEAR FROM paid_date) = $1 
        AND EXTRACT(MONTH FROM paid_date) = $2
        AND status = 'paid'
      GROUP BY fee_type
    `, [year, month]);

    // Expense categories
    const expenseCategories = await pool.query(`
      SELECT category, SUM(amount) as amount
      FROM expenses
      WHERE EXTRACT(YEAR FROM date) = $1 
        AND EXTRACT(MONTH FROM date) = $2
      GROUP BY category
    `, [year, month]);

    res.json({
      income: feeCategories.rows,
      expenses: expenseCategories.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Monthly Comparisons
router.get('/monthly-comparison/:year', authenticateToken, async (req, res) => {
  try {
    const { year } = req.params;
    const comparison = [];

    for (let month = 1; month <= 12; month++) {
      const income = await pool.query(`
        SELECT SUM(amount) as total
        FROM fees
        WHERE EXTRACT(YEAR FROM paid_date) = $1 
          AND EXTRACT(MONTH FROM paid_date) = $2
          AND status = 'paid'
      `, [year, month]);

      const expenses = await pool.query(`
        SELECT SUM(amount) as total
        FROM expenses
        WHERE EXTRACT(YEAR FROM date) = $1 
          AND EXTRACT(MONTH FROM date) = $2
      `, [year, month]);

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
router.post('/expenses', authenticateToken, async (req, res) => {
  try {
    const { category, description, amount, date, payment_method } = req.body;

    const result = await pool.query(
      `INSERT INTO expenses (category, description, amount, date, payment_method)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [category, description, amount, date, payment_method]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all expenses
router.get('/expenses/all', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM expenses ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

