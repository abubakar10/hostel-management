import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Search, X, Filter, Utensils, Calendar, DollarSign, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

const Mess = () => {
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm } = useNotification()
  const [activeTab, setActiveTab] = useState('menu')
  const [menus, setMenus] = useState([])
  const [mealAttendance, setMealAttendance] = useState([])
  const [messFees, setMessFees] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [menuFormData, setMenuFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    meal_type: 'breakfast',
    menu_items: []
  })
  const [attendanceFormData, setAttendanceFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    meal_type: 'breakfast',
    records: []
  })
  const [feeFormData, setFeeFormData] = useState({
    student_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: ''
  })

  useEffect(() => {
    fetchData()
  }, [activeTab, selectedDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'menu') {
        const response = await api.get('/api/mess/menu', { params: { date: selectedDate } })
        setMenus(response.data)
      } else if (activeTab === 'attendance') {
        const response = await api.get('/api/mess/attendance', { params: { date: selectedDate } })
        setMealAttendance(response.data)
      } else if (activeTab === 'fees') {
        const response = await api.get('/api/mess/fees')
        setMessFees(response.data)
      }
      
      if (activeTab !== 'menu') {
        const studentsRes = await api.get('/api/students')
        setStudents(studentsRes.data.filter(s => s.status === 'active'))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMenuSubmit = async (e) => {
    e.preventDefault()
    try {
      const menuItemsArray = menuFormData.menu_items
        .split(',')
        .map(item => item.trim())
        .filter(item => item)

      if (editingItem) {
        await api.put(`/api/mess/menu/${editingItem.id}`, { menu_items: menuItemsArray })
        showSuccess('Menu updated successfully')
      } else {
        await api.post('/api/mess/menu', { ...menuFormData, menu_items: menuItemsArray })
        showSuccess('Menu created successfully')
      }
      fetchData()
      setShowMenuModal(false)
      resetMenuForm()
    } catch (error) {
      showError(error.response?.data?.error || 'Error saving menu')
    }
  }

  const handleAttendanceSubmit = async (e) => {
    e.preventDefault()
    try {
      if (attendanceFormData.records.length === 0) {
        showError('Please select at least one student')
        return
      }

      await api.post('/api/mess/attendance/bulk', {
        date: attendanceFormData.date,
        meal_type: attendanceFormData.meal_type,
        records: attendanceFormData.records
      })
      showSuccess('Meal attendance recorded successfully')
      fetchData()
      setShowAttendanceModal(false)
      resetAttendanceForm()
    } catch (error) {
      showError(error.response?.data?.error || 'Error recording attendance')
    }
  }

  const handleFeeSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await api.put(`/api/mess/fees/${editingItem.id}`, feeFormData)
        showSuccess('Mess fee updated successfully')
      } else {
        await api.post('/api/mess/fees', feeFormData)
        showSuccess('Mess fee created successfully')
      }
      fetchData()
      setShowFeeModal(false)
      resetFeeForm()
    } catch (error) {
      showError(error.response?.data?.error || 'Error saving mess fee')
    }
  }

  const handleMarkFeePaid = async (id) => {
    try {
      await api.put(`/api/mess/fees/${id}`, {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0]
      })
      showSuccess('Mess fee marked as paid')
      fetchData()
    } catch (error) {
      showError(error.response?.data?.error || 'Error updating fee')
    }
  }

  const resetMenuForm = () => {
    setMenuFormData({
      date: new Date().toISOString().split('T')[0],
      meal_type: 'breakfast',
      menu_items: []
    })
    setEditingItem(null)
  }

  const resetAttendanceForm = () => {
    setAttendanceFormData({
      date: new Date().toISOString().split('T')[0],
      meal_type: 'breakfast',
      records: []
    })
  }

  const resetFeeForm = () => {
    setFeeFormData({
      student_id: '',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amount: ''
    })
    setEditingItem(null)
  }

  const toggleStudentAttendance = (studentId, status = 'present') => {
    setAttendanceFormData(prev => {
      const existing = prev.records.find(r => r.student_id === studentId)
      if (existing) {
        return {
          ...prev,
          records: prev.records.map(r =>
            r.student_id === studentId ? { ...r, status } : r
          )
        }
      } else {
        return {
          ...prev,
          records: [...prev.records, { student_id: studentId, status }]
        }
      }
    })
  }

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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Mess Management</h1>
          <p className="text-gray-600">Manage menus, meal attendance, and mess fees</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'menu' && (
            <button
              onClick={() => {
                resetMenuForm()
                setShowMenuModal(true)
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Add Menu
            </button>
          )}
          {activeTab === 'attendance' && (
            <button
              onClick={() => {
                resetAttendanceForm()
                setShowAttendanceModal(true)
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Mark Attendance
            </button>
          )}
          {activeTab === 'fees' && (
            <button
              onClick={() => {
                resetFeeForm()
                setShowFeeModal(true)
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={20} />
              Add Fee
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('menu')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'menu'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Utensils size={18} className="inline mr-2" />
          Menu
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'attendance'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Users size={18} className="inline mr-2" />
          Attendance
        </button>
        <button
          onClick={() => setActiveTab('fees')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'fees'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <DollarSign size={18} className="inline mr-2" />
          Fees
        </button>
      </div>

      {/* Menu Tab */}
      {activeTab === 'menu' && (
        <div className="card">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['breakfast', 'lunch', 'dinner'].map(mealType => {
              const menu = menus.find(m => m.meal_type === mealType && m.date === selectedDate)
              return (
                <div key={mealType} className="border rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 capitalize">{mealType}</h3>
                  {menu ? (
                    <div>
                      <ul className="list-disc list-inside text-sm text-gray-600 mb-2">
                        {menu.menu_items?.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                      <button
                        onClick={() => {
                          setEditingItem(menu)
                          setMenuFormData({
                            date: menu.date,
                            meal_type: menu.meal_type,
                            menu_items: menu.menu_items?.join(', ') || ''
                          })
                          setShowMenuModal(true)
                        }}
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setMenuFormData({
                          date: selectedDate,
                          meal_type: mealType,
                          menu_items: ''
                        })
                        setShowMenuModal(true)
                      }}
                      className="text-gray-500 hover:text-primary-600 text-sm"
                    >
                      Add {mealType} menu
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="card">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Student</th>
                  <th className="table-header-cell">Breakfast</th>
                  <th className="table-header-cell">Lunch</th>
                  <th className="table-header-cell">Dinner</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {students.map((student, index) => {
                  const breakfast = mealAttendance.find(
                    a => a.student_id === student.id && a.meal_type === 'breakfast' && a.date === selectedDate
                  )
                  const lunch = mealAttendance.find(
                    a => a.student_id === student.id && a.meal_type === 'lunch' && a.date === selectedDate
                  )
                  const dinner = mealAttendance.find(
                    a => a.student_id === student.id && a.meal_type === 'dinner' && a.date === selectedDate
                  )
                  return (
                    <tr key={student.id}>
                      <td className="table-cell">
                        {student.first_name} {student.last_name}
                      </td>
                      <td className="table-cell">
                        <span className={`px-2 py-1 rounded text-xs ${
                          breakfast?.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {breakfast?.status || 'Not marked'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`px-2 py-1 rounded text-xs ${
                          lunch?.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {lunch?.status || 'Not marked'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`px-2 py-1 rounded text-xs ${
                          dinner?.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {dinner?.status || 'Not marked'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fees Tab */}
      {activeTab === 'fees' && (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Student</th>
                  <th className="table-header-cell">Month/Year</th>
                  <th className="table-header-cell">Amount</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {messFees.map((fee, index) => (
                  <tr key={fee.id}>
                    <td className="table-cell">
                      {fee.first_name} {fee.last_name}
                    </td>
                    <td className="table-cell">
                      {fee.month}/{fee.year}
                    </td>
                    <td className="table-cell">RS {parseFloat(fee.amount).toLocaleString()}</td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        fee.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {fee.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      {fee.status === 'pending' && (
                        <button
                          onClick={() => handleMarkFeePaid(fee.id)}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Menu Modal */}
      <AnimatePresence>
        {showMenuModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowMenuModal(false)
              resetMenuForm()
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md modal-content"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Add Menu</h2>
              <form onSubmit={handleMenuSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={menuFormData.date}
                    onChange={(e) => setMenuFormData({ ...menuFormData, date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type *</label>
                  <select
                    value={menuFormData.meal_type}
                    onChange={(e) => setMenuFormData({ ...menuFormData, meal_type: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Menu Items *</label>
                  <textarea
                    value={typeof menuFormData.menu_items === 'string' ? menuFormData.menu_items : menuFormData.menu_items.join(', ')}
                    onChange={(e) => setMenuFormData({ ...menuFormData, menu_items: e.target.value })}
                    className="input-field"
                    rows="4"
                    placeholder="Enter items separated by commas"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingItem ? 'Update' : 'Create'} Menu
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenuModal(false)
                      resetMenuForm()
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendance Modal */}
      <AnimatePresence>
        {showAttendanceModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowAttendanceModal(false)
              resetAttendanceForm()
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-content"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Mark Meal Attendance</h2>
              <form onSubmit={handleAttendanceSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={attendanceFormData.date}
                      onChange={(e) => setAttendanceFormData({ ...attendanceFormData, date: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meal Type *</label>
                    <select
                      value={attendanceFormData.meal_type}
                      onChange={(e) => setAttendanceFormData({ ...attendanceFormData, meal_type: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Students</label>
                  <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
                    {students.map(student => {
                      const record = attendanceFormData.records.find(r => r.student_id === student.id)
                      return (
                        <div key={student.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                          <span>{student.first_name} {student.last_name}</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => toggleStudentAttendance(student.id, 'present')}
                              className={`px-3 py-1 rounded text-xs ${
                                record?.status === 'present'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleStudentAttendance(student.id, 'absent')}
                              className={`px-3 py-1 rounded text-xs ${
                                record?.status === 'absent'
                                  ? 'bg-red-500 text-white'
                                  : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              Absent
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Record Attendance
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAttendanceModal(false)
                      resetAttendanceForm()
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fee Modal */}
      <AnimatePresence>
        {showFeeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowFeeModal(false)
              resetFeeForm()
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md modal-content"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Add Mess Fee</h2>
              <form onSubmit={handleFeeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                  <select
                    value={feeFormData.student_id}
                    onChange={(e) => setFeeFormData({ ...feeFormData, student_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name} ({student.student_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month *</label>
                    <select
                      value={feeFormData.month}
                      onChange={(e) => setFeeFormData({ ...feeFormData, month: parseInt(e.target.value) })}
                      className="input-field"
                      required
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                    <input
                      type="number"
                      value={feeFormData.year}
                      onChange={(e) => setFeeFormData({ ...feeFormData, year: parseInt(e.target.value) })}
                      className="input-field"
                      required
                      min="2020"
                      max="2100"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RS) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={feeFormData.amount}
                    onChange={(e) => setFeeFormData({ ...feeFormData, amount: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingItem ? 'Update' : 'Create'} Fee
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowFeeModal(false)
                      resetFeeForm()
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Mess

