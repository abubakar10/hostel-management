import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion } from 'framer-motion'
import { Calendar, CheckCircle, XCircle, Clock, Download, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useNotification } from '../context/NotificationContext'

const Attendance = () => {
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [view, setView] = useState('daily')
  const [loading, setLoading] = useState(true)
  const [monthlyReport, setMonthlyReport] = useState([])

  useEffect(() => {
    fetchStudents()
    if (view === 'daily') {
      fetchDailyAttendance()
    } else {
      fetchMonthlyReport()
    }
  }, [selectedDate, selectedMonth, view])

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/students')
      // Students are already filtered by hostel on the backend
      setStudents(response.data.filter(s => s.status === 'active'))
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchDailyAttendance = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/api/attendance/daily/${selectedDate}`)
      setAttendance(response.data)
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthlyReport = async () => {
    setLoading(true)
    try {
      const [year, month] = selectedMonth.split('-')
      const response = await api.get(`/api/attendance/monthly/${year}/${month}`)
      setMonthlyReport(response.data)
    } catch (error) {
      console.error('Error fetching monthly report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = async (studentId, status) => {
    try {
      await api.post('/api/attendance', {
        student_id: studentId,
        date: selectedDate,
        status,
        remarks: ''
      })
      fetchDailyAttendance()
      showSuccess('Attendance updated successfully')
    } catch (error) {
      showError(error.response?.data?.error || 'Error updating attendance')
    }
  }

  const handleBulkAttendance = async (records) => {
    try {
      const response = await api.post('/api/attendance/bulk', {
        date: selectedDate,
        records
      })
      fetchDailyAttendance()
      if (response.data.errors && response.data.errors.length > 0) {
        showError(`Attendance recorded for ${response.data.records?.length || 0} student(s). Some students were skipped: ${response.data.errors.map(e => e.error).join(', ')}`)
      } else {
        showSuccess(`Attendance recorded successfully for ${response.data.records?.length || records.length} student(s)!`)
      }
    } catch (error) {
      showError(error.response?.data?.error || 'Error recording attendance')
    }
  }

  const markAllPresent = () => {
    // Filter out students who were registered after the selected date
    const selectedDateObj = new Date(selectedDate)
    const validStudents = students.filter(student => {
      if (!student.created_at) return true // If no created_at, allow (for backward compatibility)
      const registrationDate = new Date(student.created_at)
      return selectedDateObj >= registrationDate
    })

    if (validStudents.length === 0) {
      showError('No students can have attendance marked for this date. All students were registered after this date.')
      return
    }

    if (validStudents.length < students.length) {
      const skippedCount = students.length - validStudents.length
      showConfirm(
        `${skippedCount} student(s) will be skipped because they were registered after ${selectedDate}. Continue?`,
        () => {
          const records = validStudents.map(student => ({
            student_id: student.id,
            status: 'present',
            remarks: ''
          }))
          handleBulkAttendance(records)
        }
      )
      return
    }

    const records = validStudents.map(student => ({
      student_id: student.id,
      status: 'present',
      remarks: ''
    }))
    handleBulkAttendance(records)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Attendance Tracking</h1>
          <p className="text-gray-600 dark:text-gray-400">Track daily attendance and monthly reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('daily')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'daily' ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setView('monthly')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'monthly' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Monthly Report
          </button>
        </div>
      </div>

      {view === 'daily' ? (
        <>
          <div className="card">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Calendar size={24} className="text-primary-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <button
                onClick={markAllPresent}
                className="btn-primary flex items-center gap-2"
              >
                <CheckCircle size={20} />
                Mark All Present
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                {(() => {
                  const selectedDateObj = new Date(selectedDate)
                  const studentsAfterDate = students.filter(s => {
                    if (!s.created_at) return false
                    return new Date(s.created_at) > selectedDateObj
                  })
                  
                  if (studentsAfterDate.length > 0) {
                    return (
                      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-yellow-800 dark:text-yellow-300">
                            <p className="font-medium mb-1">Note:</p>
                            <p>
                              {studentsAfterDate.length} student(s) cannot have attendance marked for {selectedDate} because they were registered after this date. 
                              Their attendance buttons are disabled.
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}
                <div className="table-container">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Student ID</th>
                      <th className="table-header-cell">Name</th>
                      <th className="table-header-cell">Room</th>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {students.map((student, index) => {
                      const attendanceRecord = attendance.find(a => a.student_id === student.id)
                      const status = attendanceRecord?.status || 'absent'
                      
                      // Check if student was registered before or on the selected date
                      const selectedDateObj = new Date(selectedDate)
                      const registrationDate = student.created_at ? new Date(student.created_at) : null
                      const canMarkAttendance = !registrationDate || selectedDateObj >= registrationDate
                      const registrationDateStr = registrationDate ? registrationDate.toISOString().split('T')[0] : null
                      
                      return (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            !canMarkAttendance ? 'opacity-60' : ''
                          }`}
                        >
                          <td className="table-cell font-medium">{student.student_id}</td>
                          <td className="table-cell">
                            {student.first_name} {student.last_name}
                            {!canMarkAttendance && registrationDateStr && (
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400" title={`Registered on ${registrationDateStr}`}>
                                (Registered: {registrationDateStr})
                              </span>
                            )}
                          </td>
                          <td className="table-cell">{student.room_number || 'N/A'}</td>
                          <td className="table-cell">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              status === 'present' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' :
                              status === 'late' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300' :
                              'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                            }`}>
                              {status}
                            </span>
                          </td>
                          <td className="table-cell">
                            {!canMarkAttendance ? (
                              <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                Cannot mark (registered after {selectedDate})
                              </span>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAttendanceChange(student.id, 'present')}
                                  className={`p-2 rounded transition-colors ${
                                    status === 'present' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                  title="Present"
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => handleAttendanceChange(student.id, 'late')}
                                  className={`p-2 rounded transition-colors ${
                                    status === 'late' ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                  title="Late"
                                >
                                  <Clock size={18} />
                                </button>
                                <button
                                  onClick={() => handleAttendanceChange(student.id, 'absent')}
                                  className={`p-2 rounded transition-colors ${
                                    status === 'absent' ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                  }`}
                                  title="Absent"
                                >
                                  <XCircle size={18} />
                                </button>
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="card">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-field"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Student ID</th>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Present</th>
                    <th className="table-header-cell">Absent</th>
                    <th className="table-header-cell">Late</th>
                    <th className="table-header-cell">Total Days</th>
                    <th className="table-header-cell">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {monthlyReport.map((record, index) => {
                    const total = record.total_days || 0
                    const present = record.present_days || 0
                    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0
                    
                    return (
                      <motion.tr
                        key={record.student_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="table-cell font-medium">{record.student_number}</td>
                        <td className="table-cell">{record.first_name} {record.last_name}</td>
                        <td className="table-cell text-green-600 dark:text-green-400 font-semibold">{record.present_days || 0}</td>
                        <td className="table-cell text-red-600 dark:text-red-400 font-semibold">{record.absent_days || 0}</td>
                        <td className="table-cell text-yellow-600 dark:text-yellow-400 font-semibold">{record.late_days || 0}</td>
                        <td className="table-cell">{total}</td>
                        <td className="table-cell">
                          <span className={`font-semibold ${
                            percentage >= 75 ? 'text-green-600 dark:text-green-400' :
                            percentage >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {percentage}%
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Attendance

