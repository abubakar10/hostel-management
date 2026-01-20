import { useState, useEffect } from 'react'
import api from '../../config/api'
import { motion } from 'framer-motion'
import { DollarSign, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react'
import { useNotification } from '../../context/NotificationContext'

const StudentFees = () => {
  const { showError } = useNotification()
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFees()
  }, [])

  const fetchFees = async () => {
    try {
      const response = await api.get('/api/student/fees')
      setFees(response.data)
    } catch (error) {
      showError('Error loading fees')
      console.error('Error fetching fees:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const stats = {
    total: fees.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0),
    paid: fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + parseFloat(f.amount || 0), 0),
    pending: fees.filter(f => f.status === 'pending' || f.status === 'overdue').reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2">My Fees</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">View your fee status and payment history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Fees</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
            RS {stats.total.toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Paid</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
            RS {stats.paid.toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Pending</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            RS {stats.pending.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Fees List */}
      <div className="card">
        <div className="table-container -mx-3 sm:mx-0">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Fee Type</th>
                <th className="table-header-cell">Amount</th>
                <th className="table-header-cell">Due Date</th>
                <th className="table-header-cell">Paid Date</th>
                <th className="table-header-cell">Status</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {fees.map((fee, index) => (
                <motion.tr
                  key={fee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="table-cell">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs font-medium capitalize">
                      {fee.fee_type}
                    </span>
                  </td>
                  <td className="table-cell font-semibold">RS {parseFloat(fee.amount).toLocaleString()}</td>
                  <td className="table-cell">{new Date(fee.due_date).toLocaleDateString()}</td>
                  <td className="table-cell">
                    {fee.paid_date ? new Date(fee.paid_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(fee.status)}`}>
                      {fee.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {fees.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No fees found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentFees

