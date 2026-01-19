import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion } from 'framer-motion'
import { Calendar, CheckCircle, XCircle, Clock, Download } from 'lucide-react'
import { format } from 'date-fns'

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
      const response = await axios.get('/api/students')
      setStudents(response.data.filter(s => s.status === 'active'))
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchDailyAttendance = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/attendance/daily/${selectedDate}`)
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
      const response = await axios.get(`/api/attendance/monthly/${year}/${month}`)
      setMonthlyReport(response.data)
    } catch (error) {
      console.error('Error fetching monthly report:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAttendanceChange = async (studentId, status) => {
    try {
      await axios.post('/api/attendance', {
        student_id: studentId,
        date: selectedDate,
        status,
        remarks: ''
      })
      fetchDailyAttendance()
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating attendance')
    }
  }

  const handleBulkAttendance = async (records) => {
    try {
      await axios.post('/api/attendance/bulk', {
        date: selectedDate,
        records
      })
      fetchDailyAttendance()
      alert('Attendance recorded successfully!')
    } catch (error) {
      alert(error.response?.data?.error || 'Error recording attendance')
    }
  }

  const markAllPresent = () => {
    const records = students.map(student => ({
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Attendance Tracking</h1>
          <p className="text-gray-600">Track daily attendance and monthly reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('daily')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === 'daily' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700'
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
                      
                      return (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50"
                        >
                          <td className="table-cell font-medium">{student.student_id}</td>
                          <td className="table-cell">{student.first_name} {student.last_name}</td>
                          <td className="table-cell">{student.room_number || 'N/A'}</td>
                          <td className="table-cell">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              status === 'present' ? 'bg-green-100 text-green-800' :
                              status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {status}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAttendanceChange(student.id, 'present')}
                                className={`p-2 rounded transition-colors ${
                                  status === 'present' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title="Present"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleAttendanceChange(student.id, 'late')}
                                className={`p-2 rounded transition-colors ${
                                  status === 'late' ? 'bg-yellow-100 text-yellow-600' : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title="Late"
                              >
                                <Clock size={18} />
                              </button>
                              <button
                                onClick={() => handleAttendanceChange(student.id, 'absent')}
                                className={`p-2 rounded transition-colors ${
                                  status === 'absent' ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:bg-gray-100'
                                }`}
                                title="Absent"
                              >
                                <XCircle size={18} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
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
                        className="hover:bg-gray-50"
                      >
                        <td className="table-cell font-medium">{record.student_number}</td>
                        <td className="table-cell">{record.first_name} {record.last_name}</td>
                        <td className="table-cell text-green-600 font-semibold">{record.present_days || 0}</td>
                        <td className="table-cell text-red-600 font-semibold">{record.absent_days || 0}</td>
                        <td className="table-cell text-yellow-600 font-semibold">{record.late_days || 0}</td>
                        <td className="table-cell">{total}</td>
                        <td className="table-cell">
                          <span className={`font-semibold ${
                            percentage >= 75 ? 'text-green-600' :
                            percentage >= 50 ? 'text-yellow-600' :
                            'text-red-600'
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

