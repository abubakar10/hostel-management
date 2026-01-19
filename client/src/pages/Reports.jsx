import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'

const Reports = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [incomeExpenses, setIncomeExpenses] = useState(null)
  const [profitLoss, setProfitLoss] = useState([])
  const [categoryBreakdown, setCategoryBreakdown] = useState({ income: [], expenses: [] })
  const [monthlyComparison, setMonthlyComparison] = useState([])
  const [loading, setLoading] = useState(true)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  useEffect(() => {
    fetchReports()
  }, [selectedYear, selectedMonth])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const [incomeExp, profit, category, comparison] = await Promise.all([
        axios.get(`/api/reports/income-expenses/${selectedYear}/${selectedMonth}`),
        axios.get(`/api/reports/profit-loss/${selectedYear}`),
        axios.get(`/api/reports/category-breakdown/${selectedYear}/${selectedMonth}`),
        axios.get(`/api/reports/monthly-comparison/${selectedYear}`)
      ])

      setIncomeExpenses(incomeExp.data)
      setProfitLoss(profit.data)
      setCategoryBreakdown(category.data)
      setMonthlyComparison(comparison.data)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Financial reports and analytics dashboard</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="input-field"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="input-field"
          >
            {monthNames.map((month, index) => (
              <option key={index + 1} value={index + 1}>{month}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Monthly Income & Expenses */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Monthly Income & Expenses</h2>
        {incomeExpenses && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Hostel Income</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{parseFloat(incomeExpenses.income.hostel_income || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Mess Income</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹{parseFloat(incomeExpenses.income.mess_income || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{incomeExpenses.net.total_expenses.toLocaleString()}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              incomeExpenses.net.total_income - incomeExpenses.net.total_expenses >= 0
                ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <p className="text-sm text-gray-600 mb-1">Net</p>
              <p className={`text-2xl font-bold ${
                incomeExpenses.net.total_income - incomeExpenses.net.total_expenses >= 0
                  ? 'text-green-600' : 'text-red-600'
              }`}>
                ₹{(incomeExpenses.net.total_income - incomeExpenses.net.total_expenses).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Profit/Loss Analysis */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Profit / Loss Analysis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={profitLoss}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={(value) => monthNames[value - 1]} />
            <YAxis />
            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            <Legend />
            <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
            <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit/Loss" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Income by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryBreakdown.income}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {categoryBreakdown.income.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Expenses by Category</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryBreakdown.expenses}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {categoryBreakdown.expenses.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Comparisons */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Monthly Comparisons</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyComparison}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={(value) => monthNames[value - 1]} />
            <YAxis />
            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Income" />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default Reports

