import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Search, X, CheckCircle, XCircle, Clock, Filter, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

const RoomTransfers = () => {
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm } = useNotification()
  const [transfers, setTransfers] = useState([])
  const [students, setStudents] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formData, setFormData] = useState({
    student_id: '',
    from_room_id: '',
    to_room_id: '',
    reason: ''
  })
  const [approvalData, setApprovalData] = useState({
    status: '',
    transfer_date: ''
  })

  useEffect(() => {
    fetchTransfers()
    fetchStudents()
    fetchRooms()
  }, [statusFilter])

  const fetchTransfers = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {}
      const response = await api.get('/api/room-transfers', { params })
      setTransfers(response.data)
    } catch (error) {
      console.error('Error fetching transfers:', error)
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

  const fetchRooms = async () => {
    try {
      const response = await api.get('/api/rooms')
      setRooms(response.data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/room-transfers', formData)
      showSuccess('Room transfer request submitted successfully')
      fetchTransfers()
      setShowModal(false)
      resetForm()
    } catch (error) {
      showError(error.response?.data?.error || 'Error submitting transfer request')
    }
  }

  const handleApprove = async (id) => {
    showConfirm(
      'Are you sure you want to approve this room transfer? This will automatically update room occupancy.',
      async () => {
        try {
          await api.put(`/api/room-transfers/${id}`, {
            status: 'approved',
            transfer_date: new Date().toISOString().split('T')[0]
          })
          showSuccess('Room transfer approved successfully')
          fetchTransfers()
          fetchRooms()
        } catch (error) {
          showError(error.response?.data?.error || 'Error approving transfer')
        }
      }
    )
  }

  const handleReject = async (id) => {
    showConfirm(
      'Are you sure you want to reject this room transfer request?',
      async () => {
        try {
          await api.put(`/api/room-transfers/${id}`, { status: 'rejected' })
          showSuccess('Room transfer rejected')
          fetchTransfers()
        } catch (error) {
          showError(error.response?.data?.error || 'Error rejecting transfer')
        }
      }
    )
  }

  const handleDelete = async (id) => {
    showConfirm(
      'Are you sure you want to delete this transfer request?',
      async () => {
        try {
          await api.delete(`/api/room-transfers/${id}`)
          fetchTransfers()
          showSuccess('Transfer request deleted successfully')
        } catch (error) {
          showError(error.response?.data?.error || 'Error deleting transfer')
        }
      }
    )
  }

  const resetForm = () => {
    setFormData({
      student_id: '',
      from_room_id: '',
      to_room_id: '',
      reason: ''
    })
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

  const filteredTransfers = transfers.filter(transfer => {
    const searchLower = searchTerm.toLowerCase()
    return (
      `${transfer.student_first_name} ${transfer.student_last_name}`.toLowerCase().includes(searchLower) ||
      transfer.from_room?.toLowerCase().includes(searchLower) ||
      transfer.to_room?.toLowerCase().includes(searchLower) ||
      transfer.reason?.toLowerCase().includes(searchLower)
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Room Transfer Requests</h1>
          <p className="text-gray-600">Manage student room transfer requests</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Transfer Request
        </button>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search transfers..."
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
                <th className="table-header-cell">From Room</th>
                <th className="table-header-cell">To Room</th>
                <th className="table-header-cell">Reason</th>
                <th className="table-header-cell">Requested At</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              <AnimatePresence>
                {filteredTransfers.map((transfer, index) => (
                  <motion.tr
                    key={transfer.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="table-cell">
                      {transfer.student_first_name && transfer.student_last_name
                        ? `${transfer.student_first_name} ${transfer.student_last_name}`
                        : 'N/A'}
                    </td>
                    <td className="table-cell font-medium">{transfer.from_room || 'N/A'}</td>
                    <td className="table-cell font-medium">{transfer.to_room || 'N/A'}</td>
                    <td className="table-cell">
                      <div className="max-w-xs truncate" title={transfer.reason}>
                        {transfer.reason || '-'}
                      </div>
                    </td>
                    <td className="table-cell">
                      {transfer.requested_at
                        ? new Date(transfer.requested_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                        {transfer.status || 'pending'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        {transfer.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(transfer.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Approve"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(transfer.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(transfer.id)}
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
          {filteredTransfers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No transfer requests found
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
                <h2 className="text-2xl font-bold text-gray-800">New Room Transfer Request</h2>
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
                      onChange={(e) => {
                        const student = students.find(s => s.id === parseInt(e.target.value))
                        setFormData({
                          ...formData,
                          student_id: e.target.value,
                          from_room_id: student?.room_id || ''
                        })
                      }}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Room *</label>
                    <select
                      value={formData.from_room_id}
                      onChange={(e) => setFormData({ ...formData, from_room_id: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select Room</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.room_number} - {room.type_name || 'N/A'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Room *</label>
                    <select
                      value={formData.to_room_id}
                      onChange={(e) => setFormData({ ...formData, to_room_id: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select Room</option>
                      {rooms
                        .filter(room => room.id !== parseInt(formData.from_room_id))
                        .map(room => (
                          <option key={room.id} value={room.id}>
                            {room.room_number} - {room.type_name || 'N/A'} 
                            ({room.capacity - (room.current_occupancy_count || 0)} available)
                          </option>
                        ))}
                    </select>
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
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Submit Request
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

export default RoomTransfers

