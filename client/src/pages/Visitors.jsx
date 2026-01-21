import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Search, X, LogIn, LogOut, Filter, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

const Visitors = () => {
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm } = useNotification()
  const [visitors, setVisitors] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingVisitor, setEditingVisitor] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formData, setFormData] = useState({
    student_id: '',
    visitor_name: '',
    visitor_phone: '',
    visitor_id_type: 'CNIC',
    visitor_id_number: '',
    relationship: '',
    purpose: ''
  })

  useEffect(() => {
    fetchVisitors()
    fetchStudents()
  }, [statusFilter])

  const fetchVisitors = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {}
      const response = await api.get('/api/visitors', { params })
      setVisitors(response.data)
    } catch (error) {
      console.error('Error fetching visitors:', error)
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
      if (editingVisitor) {
        await api.put(`/api/visitors/${editingVisitor.id}`, formData)
        showSuccess('Visitor updated successfully')
      } else {
        await api.post('/api/visitors', formData)
        showSuccess('Visitor checked in successfully')
      }
      fetchVisitors()
      setShowModal(false)
      resetForm()
    } catch (error) {
      showError(error.response?.data?.error || 'Error saving visitor')
    }
  }

  const handleCheckout = async (id) => {
    try {
      await api.put(`/api/visitors/${id}/checkout`)
      showSuccess('Visitor checked out successfully')
      fetchVisitors()
    } catch (error) {
      showError(error.response?.data?.error || 'Error checking out visitor')
    }
  }

  const handleEdit = (visitor) => {
    setEditingVisitor(visitor)
    setFormData({
      student_id: visitor.student_id || '',
      visitor_name: visitor.visitor_name || '',
      visitor_phone: visitor.visitor_phone || '',
      visitor_id_type: visitor.visitor_id_type || 'CNIC',
      visitor_id_number: visitor.visitor_id_number || '',
      relationship: visitor.relationship || '',
      purpose: visitor.purpose || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    showConfirm(
      'Are you sure you want to delete this visitor record?',
      async () => {
        try {
          await api.delete(`/api/visitors/${id}`)
          fetchVisitors()
          showSuccess('Visitor record deleted successfully')
        } catch (error) {
          showError(error.response?.data?.error || 'Error deleting visitor')
        }
      }
    )
  }

  const resetForm = () => {
    setFormData({
      student_id: '',
      visitor_name: '',
      visitor_phone: '',
      visitor_id_type: 'CNIC',
      visitor_id_number: '',
      relationship: '',
      purpose: ''
    })
    setEditingVisitor(null)
  }

  const filteredVisitors = visitors.filter(visitor => {
    const searchLower = searchTerm.toLowerCase()
    return (
      visitor.visitor_name?.toLowerCase().includes(searchLower) ||
      visitor.visitor_phone?.toLowerCase().includes(searchLower) ||
      `${visitor.student_first_name} ${visitor.student_last_name}`.toLowerCase().includes(searchLower) ||
      visitor.visitor_id_number?.toLowerCase().includes(searchLower)
    )
  })

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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Visitor Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage visitor check-in and check-out</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Check In Visitor
        </button>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search visitors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Status</option>
            <option value="inside">Inside</option>
            <option value="exited">Exited</option>
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Visitor Name</th>
                <th className="table-header-cell">Student</th>
                <th className="table-header-cell">Phone</th>
                <th className="table-header-cell">ID Number</th>
                <th className="table-header-cell">Relationship</th>
                <th className="table-header-cell">Entry Time</th>
                <th className="table-header-cell">Exit Time</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              <AnimatePresence>
                {filteredVisitors.map((visitor, index) => (
                  <motion.tr
                    key={visitor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="table-cell font-medium">{visitor.visitor_name}</td>
                    <td className="table-cell">
                      {visitor.student_first_name && visitor.student_last_name
                        ? `${visitor.student_first_name} ${visitor.student_last_name}`
                        : 'N/A'}
                    </td>
                    <td className="table-cell">{visitor.visitor_phone || '-'}</td>
                    <td className="table-cell">{visitor.visitor_id_number || '-'}</td>
                    <td className="table-cell">{visitor.relationship || '-'}</td>
                    <td className="table-cell">
                      {visitor.entry_time
                        ? new Date(visitor.entry_time).toLocaleString()
                        : '-'}
                    </td>
                    <td className="table-cell">
                      {visitor.exit_time
                        ? new Date(visitor.exit_time).toLocaleString()
                        : '-'}
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        visitor.status === 'inside'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {visitor.status || 'inside'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        {visitor.status === 'inside' && (
                          <button
                            onClick={() => handleCheckout(visitor.id)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                            title="Check Out"
                          >
                            <LogOut size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(visitor)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(visitor.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredVisitors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No visitors found
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowModal(false)
              resetForm()
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-content"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {editingVisitor ? 'Edit Visitor' : 'Check In Visitor'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student</label>
                    <select
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      className="input-field"
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visitor Name *</label>
                    <input
                      type="text"
                      value={formData.visitor_name}
                      onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.visitor_phone}
                      onChange={(e) => setFormData({ ...formData, visitor_phone: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Type</label>
                    <select
                      value={formData.visitor_id_type}
                      onChange={(e) => setFormData({ ...formData, visitor_id_type: e.target.value })}
                      className="input-field"
                    >
                      <option value="CNIC">CNIC</option>
                      <option value="Passport">Passport</option>
                      <option value="Driver License">Driver License</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Number</label>
                    <input
                      type="text"
                      value={formData.visitor_id_number}
                      onChange={(e) => {
                        const value = e.target.value
                        // Allow numbers, dashes, and spaces for ID numbers (e.g., CNIC format: 12345-1234567-1)
                        if (value === '' || /^[\d\s\-]+$/.test(value)) {
                          setFormData({ ...formData, visitor_id_number: value })
                        }
                      }}
                      className="input-field"
                      pattern="[\d\s\-]+"
                      placeholder="e.g., 12345-1234567-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship</label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Relationship</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Friend">Friend</option>
                      <option value="Relative">Relative</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
                    <textarea
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      className="input-field"
                      rows="3"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingVisitor ? 'Update' : 'Check In'} Visitor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
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

export default Visitors

