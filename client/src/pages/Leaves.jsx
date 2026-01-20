import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Search, X, CheckCircle, XCircle, Clock, Filter, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

const Leaves = () => {
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm } = useNotification()
  const [leaves, setLeaves] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingLeave, setEditingLeave] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formData, setFormData] = useState({
    student_id: '',
    leave_type: 'vacation',
    start_date: '',
    end_date: '',
    reason: '',
    emergency_contact: ''
  })
  const [approvalData, setApprovalData] = useState({
    status: '',
    remarks: ''
  })

  useEffect(() => {
    fetchLeaves()
    fetchStudents()
  }, [statusFilter])

  const fetchLeaves = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {}
      const response = await api.get('/api/leaves', { params })
      setLeaves(response.data)
    } catch (error) {
      console.error('Error fetching leaves:', error)
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
      if (editingLeave && editingLeave.status === 'pending') {
        // Update pending leave
        await api.put(`/api/leaves/${editingLeave.id}`, formData)
        showSuccess('Leave request updated successfully')
      } else if (!editingLeave) {
        // Create new leave
        await api.post('/api/leaves', formData)
        showSuccess('Leave request submitted successfully')
      } else {
        showError('Cannot edit approved or rejected leave requests')
        return
      }
      fetchLeaves()
      setShowModal(false)
      resetForm()
    } catch (error) {
      showError(error.response?.data?.error || 'Error saving leave request')
    }
  }

  const handleApprove = async (id) => {
    showConfirm(
      'Are you sure you want to approve this leave request?',
      async () => {
        try {
          await api.put(`/api/leaves/${id}`, { status: 'approved' })
          showSuccess('Leave request approved successfully')
          fetchLeaves()
        } catch (error) {
          showError(error.response?.data?.error || 'Error approving leave request')
        }
      }
    )
  }

  const handleReject = async (id) => {
    showConfirm(
      'Are you sure you want to reject this leave request?',
      async () => {
        try {
          await api.put(`/api/leaves/${id}`, { status: 'rejected', remarks: approvalData.remarks })
          showSuccess('Leave request rejected')
          fetchLeaves()
          setApprovalData({ status: '', remarks: '' })
        } catch (error) {
          showError(error.response?.data?.error || 'Error rejecting leave request')
        }
      }
    )
  }

  const handleEdit = (leave) => {
    if (leave.status !== 'pending') {
      showError('Only pending leave requests can be edited')
      return
    }
    setEditingLeave(leave)
    setFormData({
      student_id: leave.student_id || '',
      leave_type: leave.leave_type || 'vacation',
      start_date: leave.start_date || '',
      end_date: leave.end_date || '',
      reason: leave.reason || '',
      emergency_contact: leave.emergency_contact || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    showConfirm(
      'Are you sure you want to delete this leave request?',
      async () => {
        try {
          await api.delete(`/api/leaves/${id}`)
          fetchLeaves()
          showSuccess('Leave request deleted successfully')
        } catch (error) {
          showError(error.response?.data?.error || 'Error deleting leave request')
        }
      }
    )
  }

  const resetForm = () => {
    setFormData({
      student_id: '',
      leave_type: 'vacation',
      start_date: '',
      end_date: '',
      reason: '',
      emergency_contact: ''
    })
    setEditingLeave(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredLeaves = leaves.filter(leave => {
    const searchLower = searchTerm.toLowerCase()
    return (
      `${leave.student_first_name} ${leave.student_last_name}`.toLowerCase().includes(searchLower) ||
      leave.leave_type?.toLowerCase().includes(searchLower) ||
      leave.reason?.toLowerCase().includes(searchLower)
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Leave Management</h1>
          <p className="text-gray-600">Manage student leave requests</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Leave Request
        </button>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search leave requests..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Student</th>
                <th className="table-header-cell">Leave Type</th>
                <th className="table-header-cell">Start Date</th>
                <th className="table-header-cell">End Date</th>
                <th className="table-header-cell">Reason</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              <AnimatePresence>
                {filteredLeaves.map((leave, index) => (
                  <motion.tr
                    key={leave.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="table-cell">
                      {leave.student_first_name && leave.student_last_name
                        ? `${leave.student_first_name} ${leave.student_last_name}`
                        : 'N/A'}
                    </td>
                    <td className="table-cell capitalize">{leave.leave_type || '-'}</td>
                    <td className="table-cell">
                      {leave.start_date ? new Date(leave.start_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="table-cell">
                      {leave.end_date ? new Date(leave.end_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="table-cell">
                      <div className="max-w-xs truncate" title={leave.reason}>
                        {leave.reason || '-'}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}>
                        {leave.status || 'pending'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        {leave.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(leave.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(leave.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {leave.status === 'pending' && (
                          <button
                            onClick={() => handleEdit(leave)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(leave.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
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
          {filteredLeaves.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No leave requests found
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
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto modal-content"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingLeave ? 'Edit Leave Request' : 'New Leave Request'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                    <select
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      className="input-field"
                      required
                      disabled={!!editingLeave}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
                    <select
                      value={formData.leave_type}
                      onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="vacation">Vacation</option>
                      <option value="emergency">Emergency</option>
                      <option value="weekend">Weekend</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="input-field"
                      rows="3"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={formData.emergency_contact}
                      onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                      className="input-field"
                      placeholder="Contact number during leave"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingLeave ? 'Update' : 'Submit'} Request
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

export default Leaves

