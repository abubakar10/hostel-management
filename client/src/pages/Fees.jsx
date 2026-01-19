import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion } from 'framer-motion'
import { Plus, Search, DollarSign, CheckCircle, XCircle, FileText } from 'lucide-react'

const Fees = () => {
  const [fees, setFees] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
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
    } catch (error) {
      alert(error.response?.data?.error || 'Error creating fee')
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
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating fee')
    }
  }

  const viewReceipt = (fee) => {
    setSelectedReceipt(fee)
    setShowReceiptModal(true)
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Fee Management</h1>
          <p className="text-gray-600">Manage hostel and mess fees</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Fee
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-gray-600 text-sm mb-1">Total Fees</p>
          <p className="text-2xl font-bold text-gray-800">RS{stats.total.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-600">RS{stats.paid.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">RS{stats.pending.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm mb-1">Overdue</p>
          <p className="text-2xl font-bold text-red-600">RS{stats.overdue.toLocaleString()}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search fees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field md:w-48"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
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
                    className="hover:bg-gray-50"
                  >
                    <td className="table-cell">
                      {fee.first_name} {fee.last_name}
                    </td>
                    <td className="table-cell">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {fee.fee_type}
                      </span>
                    </td>
                    <td className="table-cell font-semibold">RS{parseFloat(fee.amount).toLocaleString()}</td>
                    <td className="table-cell">{new Date(fee.due_date).toLocaleDateString()}</td>
                    <td className="table-cell">
                      {fee.paid_date ? new Date(fee.paid_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        fee.status === 'paid' ? 'bg-green-100 text-green-800' :
                        fee.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {fee.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        {fee.status === 'paid' && (
                          <button
                            onClick={() => viewReceipt(fee)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View Receipt"
                          >
                            <FileText size={18} />
                          </button>
                        )}
                        {fee.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkPaid(fee)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
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
        )}
      </div>

      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add New Fee</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type *</label>
                <select
                  value={formData.fee_type}
                  onChange={(e) => setFormData({ ...formData, fee_type: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="hostel">Hostel Fee</option>
                  <option value="mess">Mess Fee</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input-field"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="btn-primary flex-1">Create Fee</button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
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
            className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md"
          >
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Receipt</h2>
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

