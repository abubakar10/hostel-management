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
    let salariesQuery = `
      SELECT SUM(salary) as total_salaries
      FROM staff
      WHERE status = 'active'
    `;
    const salariesParams = [];
    if (hostelId && req.user.role !== 'super_admin') {
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
      if (hostelId && req.user.role !== 'super_admin') {
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
      if (hostelId && req.user.role !== 'super_admin') {
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
      if (hostelId && req.user.role !== 'super_admin') {
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
    if (hostelId && req.user.role !== 'super_admin') {
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
    if (hostelId && req.user.role !== 'super_admin') {
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
      if (hostelId && req.user.role !== 'super_admin') {
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
      if (hostelId && req.user.role !== 'super_admin') {
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

