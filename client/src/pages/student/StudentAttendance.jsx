import { useState, useEffect } from 'react'
import api from '../../config/api'
import { motion } from 'framer-motion'
import { ClipboardCheck, Calendar, TrendingUp } from 'lucide-react'
import { useNotification } from '../../context/NotificationContext'

const StudentAttendance = () => {
  const { showError } = useNotification()
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchAttendance()
  }, [startDate, endDate])

  const fetchAttendance = async () => {
    try {
      const params = {}
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate
      
      const response = await api.get('/api/student/attendance', { params })
      setAttendance(response.data)
    } catch (error) {
      showError('Error loading attendance')
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    rate: attendance.length > 0 
      ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
      : 0
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
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2">My Attendance</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">View your attendance records</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Days</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.total}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Present</p>
          <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.present}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Absent</p>
          <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">{stats.absent}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Attendance Rate</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.rate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setStartDate('')
                setEndDate('')
              }}
              className="btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Attendance List */}
        <div className="table-container -mx-3 sm:mx-0">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Date</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Remarks</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {attendance.map((record, index) => (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="table-cell">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      record.status === 'present'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : record.status === 'late'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="table-cell">{record.remarks || '-'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {attendance.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No attendance records found
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentAttendance

