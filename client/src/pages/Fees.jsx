import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion } from 'framer-motion'
import { Plus, Search, DollarSign, CheckCircle, XCircle, FileText, Bell, X } from 'lucide-react'
import { useNotification } from '../context/NotificationContext'

const Fees = () => {
  const { showError, showSuccess, showConfirm } = useNotification()
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [calculatedAmount, setCalculatedAmount] = useState(null)
  const [roomInfo, setRoomInfo] = useState(null)
  const [formData, setFormData] = useState({
    student_id: '',
    fee_type: 'hostel',
    amount: '',
    due_date: '',
    payment_method: ''
  })

  useEffect(() => {
    fetchFees()
    fetchStudents()
  }, [filter])

  const fetchFees = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await api.get('/api/fees', { params })
      setFees(response.data)
    } catch (error) {
      console.error('Error fetching fees:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/students')
      setStudents(response.data.filter(s => s.status === 'active'))
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  // Fetch student's room info and calculate fee when student is selected
  const fetchStudentRoomInfo = async (studentId) => {
    if (!studentId) {
      setCalculatedAmount(null)
      setRoomInfo(null)
      return
    }

    try {
      // Use the calculate endpoint for better performance
      const response = await api.get(`/api/fees/calculate/${studentId}`)
      const data = response.data
      
      if (data.has_room && data.calculated_amount) {
        setRoomInfo({
          room_number: data.room_number,
          room_type: data.room_type,
          price: data.calculated_amount
        })
        setCalculatedAmount(data.calculated_amount)
        // Auto-calculate amount for hostel fees
        // Use functional update to preserve student_id and other fields
        setFormData(prevFormData => {
          // Always preserve student_id and all other fields
          if (prevFormData.fee_type === 'hostel') {
            return { 
              ...prevFormData, 
              student_id: studentId, // Explicitly set student_id to ensure it's preserved
              amount: data.calculated_amount.toString() 
            }
          }
          // If not hostel fee, preserve everything including student_id
          return { ...prevFormData, student_id: studentId }
        })
      } else {
        setRoomInfo(null)
        setCalculatedAmount(null)
        // Use functional update to preserve student_id
        setFormData(prevFormData => {
          if (prevFormData.fee_type === 'hostel') {
            return { 
              ...prevFormData, 
              student_id: studentId, // Explicitly set student_id to ensure it's preserved
              amount: '' 
            }
          }
          // If not hostel fee, preserve everything including student_id
          return { ...prevFormData, student_id: studentId }
        })
      }
    } catch (error) {
      console.error('Error fetching student room info:', error)
      setRoomInfo(null)
      setCalculatedAmount(null)
      // Use functional update to preserve student_id
      setFormData(prevFormData => {
        if (prevFormData.fee_type === 'hostel') {
          return { 
            ...prevFormData, 
            student_id: studentId, // Explicitly set student_id to ensure it's preserved
            amount: '' 
          }
        }
        // If not hostel fee, preserve everything including student_id
        return { ...prevFormData, student_id: studentId }
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/fees', formData)
      fetchFees()
      setShowModal(false)
      setFormData({
        student_id: '',
        fee_type: 'hostel',
        amount: '',
        due_date: '',
        payment_method: ''
      })
      setCalculatedAmount(null)
      setRoomInfo(null)
      showSuccess('Fee created successfully')
    } catch (error) {
      showError(error.response?.data?.error || 'Error creating fee')
    }
  }

  const handleMarkPaid = async (fee) => {
    try {
      await api.put(`/api/fees/${fee.id}`, {
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash'
      })
      fetchFees()
      showSuccess('Fee marked as paid successfully')
    } catch (error) {
      showError(error.response?.data?.error || 'Error updating fee')
    }
  }

  const viewReceipt = (fee) => {
    setSelectedReceipt(fee)
    setShowReceiptModal(true)
  }

  const handleSendReminders = async () => {
    showConfirm(
      'Send payment reminders to all students with overdue fees?',
      async () => {
        try {
          const response = await api.post('/api/fees/reminders/send')
          showSuccess(`Reminders sent to ${response.data.notifications} students`)
        } catch (error) {
          showError(error.response?.data?.error || 'Error sending reminders')
        }
      }
    )
  }

  const filteredFees = fees.filter(fee =>
    `${fee.first_name} ${fee.last_name} ${fee.student_number} ${fee.fee_type}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: fees.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0),
    paid: fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + parseFloat(f.amount || 0), 0),
    pending: fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + parseFloat(f.amount || 0), 0),
    overdue: fees.filter(f => f.status === 'overdue').reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2">
            Fee Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage hostel and mess fees
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {stats.overdue > 0 && (
            <button
              onClick={handleSendReminders}
              className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] sm:min-h-[44px] text-sm sm:text-base"
            >
              <Bell size={18} className="sm:w-5 sm:h-5" />
              <span>Send Reminders</span>
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] sm:min-h-[44px] text-sm sm:text-base shadow-lg active:scale-95 transition-transform"
          >
            <Plus size={18} className="sm:w-5 sm:h-5" />
            <span>Add Fee</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-3 sm:p-4">
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-1">Total Fees</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate">RS{stats.total.toLocaleString()}</p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-1">Paid</p>
          <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400 truncate">RS{stats.paid.toLocaleString()}</p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-1">Pending</p>
          <p className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400 truncate">RS{stats.pending.toLocaleString()}</p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-1">Overdue</p>
          <p className="text-lg sm:text-2xl font-bold text-red-600 dark:text-red-400 truncate">RS{stats.overdue.toLocaleString()}</p>
        </div>
      </div>

      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search fees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 sm:pl-12 text-base sm:text-sm min-h-[48px] sm:min-h-[44px]"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field sm:w-48 text-base sm:text-sm min-h-[48px] sm:min-h-[44px]"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : filteredFees.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">
              No fees found
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block table-container">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Student</th>
                    <th className="table-header-cell">Fee Type</th>
                    <th className="table-header-cell">Amount</th>
                    <th className="table-header-cell">Due Date</th>
                    <th className="table-header-cell">Paid Date</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredFees.map((fee, index) => (
                    <motion.tr
                      key={fee.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="table-cell">
                        {fee.first_name} {fee.last_name}
                      </td>
                      <td className="table-cell">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          fee.fee_type === 'hostel' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                          fee.fee_type === 'mess' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          fee.fee_type === 'security' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                          fee.fee_type === 'fine' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}>
                          {fee.fee_type === 'security' ? 'Security Fee' :
                           fee.fee_type === 'fine' ? 'Fine' :
                           fee.fee_type === 'hostel' ? 'Hostel Fee' :
                           fee.fee_type === 'mess' ? 'Mess Fee' :
                           fee.fee_type}
                        </span>
                      </td>
                      <td className="table-cell font-semibold">RS{parseFloat(fee.amount).toLocaleString()}</td>
                      <td className="table-cell">{new Date(fee.due_date).toLocaleDateString()}</td>
                      <td className="table-cell">
                        {fee.paid_date ? new Date(fee.paid_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          fee.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          fee.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          {fee.status === 'paid' && (
                            <button
                              onClick={() => viewReceipt(fee)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                              title="View Receipt"
                            >
                              <FileText size={18} />
                            </button>
                          )}
                          {fee.status !== 'paid' && (
                            <button
                              onClick={() => handleMarkPaid(fee)}
                              className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                              title="Mark as Paid"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              {filteredFees.map((fee, index) => (
                <motion.div
                  key={fee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-900/50 p-4 sm:p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/70 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
                        {fee.first_name} {fee.last_name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {fee.student_number || 'N/A'}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                      fee.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                      fee.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                      'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                    }`}>
                      {fee.status}
                    </span>
                  </div>

                  <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[90px] sm:min-w-[100px]">
                        Fee Type:
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        fee.fee_type === 'hostel' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                        fee.fee_type === 'mess' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        fee.fee_type === 'security' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                        fee.fee_type === 'fine' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {fee.fee_type === 'security' ? 'Security Fee' :
                         fee.fee_type === 'fine' ? 'Fine' :
                         fee.fee_type === 'hostel' ? 'Hostel Fee' :
                         fee.fee_type === 'mess' ? 'Mess Fee' :
                         fee.fee_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[90px] sm:min-w-[100px]">
                        Amount:
                      </span>
                      <span className="text-sm sm:text-base font-bold text-gray-700 dark:text-gray-300">
                        RS{parseFloat(fee.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[90px] sm:min-w-[100px]">
                        Due Date:
                      </span>
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {new Date(fee.due_date).toLocaleDateString()}
                      </span>
                    </div>
                    {fee.paid_date && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[90px] sm:min-w-[100px]">
                          Paid Date:
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          {new Date(fee.paid_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                    {fee.status === 'paid' ? (
                      <button
                        onClick={() => viewReceipt(fee)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium text-sm sm:text-base hover:bg-blue-100 dark:hover:bg-blue-900/30 active:scale-95 transition-all min-h-[44px] sm:min-h-[48px]"
                      >
                        <FileText size={18} className="sm:w-5 sm:h-5" />
                        <span>View Receipt</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkPaid(fee)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg font-medium text-sm sm:text-base hover:bg-green-100 dark:hover:bg-green-900/30 active:scale-95 transition-all min-h-[44px] sm:min-h-[48px]"
                      >
                        <CheckCircle size={18} className="sm:w-5 sm:h-5" />
                        <span>Mark as Paid</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-3 sm:p-4 z-50"
          onClick={() => {
            setShowModal(false)
            setCalculatedAmount(null)
            setRoomInfo(null)
            setFormData({
              student_id: '',
              fee_type: 'hostel',
              amount: '',
              due_date: '',
              payment_method: ''
            })
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6 sticky top-0 bg-white dark:bg-gray-800 pb-2 sm:pb-0 z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Add New Fee</h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setCalculatedAmount(null)
                  setRoomInfo(null)
                  setFormData({
                    student_id: '',
                    fee_type: 'hostel',
                    amount: '',
                    due_date: '',
                    payment_method: ''
                  })
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95"
                aria-label="Close modal"
              >
                <X size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Student <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.student_id}
                  onChange={(e) => {
                    const selectedStudentId = e.target.value
                    // Use functional update to ensure state consistency
                    setFormData(prevFormData => ({
                      ...prevFormData,
                      student_id: selectedStudentId
                    }))
                    // Fetch room info after state is updated
                    fetchStudentRoomInfo(selectedStudentId)
                  }}
                  className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
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
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Fee Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.fee_type}
                  onChange={(e) => {
                    const newFeeType = e.target.value
                    // Use functional update to ensure we have the latest state
                    setFormData(prevFormData => {
                      const updatedAmount = newFeeType === 'hostel' && calculatedAmount 
                        ? calculatedAmount.toString() 
                        : newFeeType !== 'hostel' ? '' : prevFormData.amount
                      
                      return {
                        ...prevFormData, // Preserve all fields including student_id
                        fee_type: newFeeType,
                        amount: updatedAmount
                      }
                    })
                  }}
                  className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                  required
                >
                  <option value="hostel">Hostel Fee</option>
                  <option value="mess">Mess Fee</option>
                  <option value="security">Security Fee</option>
                  <option value="fine">Fine</option>
                </select>
              </div>
              {formData.fee_type === 'hostel' && roomInfo && (
                <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs sm:text-sm">
                  <p className="text-blue-900 dark:text-blue-300">
                    <span className="font-medium">Room:</span> {roomInfo.room_number} ({roomInfo.room_type})
                  </p>
                  <p className="text-blue-700 dark:text-blue-400 mt-1">
                    <span className="font-medium">Room Type Fee:</span> RS{parseFloat(roomInfo.price).toLocaleString()}/month
                  </p>
                </div>
              )}
              {formData.fee_type === 'hostel' && !roomInfo && formData.student_id && (
                <div className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-xs sm:text-sm">
                  <p className="text-yellow-900 dark:text-yellow-300">
                    ⚠️ Student does not have a room assigned. Please enter amount manually.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Amount <span className="text-red-500">*</span>
                  {formData.fee_type === 'hostel' && calculatedAmount && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Auto-calculated)</span>
                  )}
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prevFormData => ({ 
                    ...prevFormData, 
                    amount: e.target.value 
                  }))}
                  className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                  required
                  min="0"
                  step="0.01"
                  placeholder={formData.fee_type === 'hostel' && calculatedAmount ? calculatedAmount.toString() : 'Enter amount'}
                />
                {formData.fee_type === 'hostel' && calculatedAmount && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    You can override the calculated amount if needed
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prevFormData => ({ 
                    ...prevFormData, 
                    due_date: e.target.value 
                  }))}
                  className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                  required
                  onInvalid={(e) => {
                    e.target.setCustomValidity('Please select a due date')
                  }}
                  onInput={(e) => {
                    e.target.setCustomValidity('')
                  }}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <button 
                  type="submit" 
                  className="btn-primary flex-1 min-h-[48px] sm:min-h-[44px] text-base sm:text-base font-semibold shadow-lg active:scale-95 transition-transform"
                >
                  Create Fee
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setCalculatedAmount(null)
                    setRoomInfo(null)
                    setFormData({
                      student_id: '',
                      fee_type: 'hostel',
                      amount: '',
                      due_date: '',
                      payment_method: ''
                    })
                  }}
                  className="btn-secondary flex-1 min-h-[48px] sm:min-h-[44px] text-base sm:text-base font-semibold active:scale-95 transition-transform"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {showReceiptModal && selectedReceipt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowReceiptModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-md"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Payment Receipt</h2>
              <p className="text-gray-600">Receipt #{selectedReceipt.receipt_number}</p>
            </div>
            <div className="space-y-3 border-t border-b py-6 my-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Student:</span>
                <span className="font-medium">{selectedReceipt.first_name} {selectedReceipt.last_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fee Type:</span>
                <span className="font-medium capitalize">{selectedReceipt.fee_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-bold text-lg">RS{parseFloat(selectedReceipt.amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid Date:</span>
                <span className="font-medium">{new Date(selectedReceipt.paid_date).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={() => {
                window.print()
              }}
              className="btn-primary w-full"
            >
              Print Receipt
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Fees

