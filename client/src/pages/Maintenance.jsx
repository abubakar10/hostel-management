import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Wrench, Search, Filter, X, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

const Maintenance = () => {
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm } = useNotification()
  const [maintenance, setMaintenance] = useState([])
  const [students, setStudents] = useState([])
  const [staff, setStaff] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [formData, setFormData] = useState({
    room_id: '',
    requested_by: '',
    title: '',
    description: '',
    priority: 'medium'
  })
  const [updateData, setUpdateData] = useState({
    status: '',
    assigned_to: '',
    cost: '',
    completed_date: ''
  })

  useEffect(() => {
    fetchMaintenance()
    fetchStudents()
    fetchStaff()
    fetchRooms()
  }, [statusFilter, priorityFilter])

  const fetchMaintenance = async () => {
    try {
      const params = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (priorityFilter !== 'all') params.priority = priorityFilter
      
      const response = await api.get('/api/complaints/maintenance/all', { params })
      setMaintenance(response.data)
    } catch (error) {
      console.error('Error fetching maintenance:', error)
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

  const fetchStaff = async () => {
    try {
      const response = await api.get('/api/staff')
      setStaff(response.data.filter(s => s.status === 'active'))
    } catch (error) {
      console.error('Error fetching staff:', error)
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
      if (editingItem) {
        await api.put(`/api/complaints/maintenance/${editingItem.id}`, updateData)
      } else {
        await api.post('/api/complaints/maintenance', formData)
      }
      fetchMaintenance()
      setShowModal(false)
      resetForm()
      showSuccess(editingItem ? 'Maintenance request updated successfully' : 'Maintenance request created successfully')
    } catch (error) {
      showError(error.response?.data?.error || 'Error saving maintenance request')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setUpdateData({
      status: item.status || '',
      assigned_to: item.assigned_to || '',
      cost: item.cost || '',
      completed_date: item.completed_date || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    showConfirm(
      'Are you sure you want to delete this maintenance request?',
      async () => {
        try {
          await api.delete(`/api/complaints/maintenance/${id}`)
          fetchMaintenance()
          showSuccess('Maintenance request deleted successfully')
        } catch (error) {
          showError(error.response?.data?.error || 'Error deleting maintenance request')
        }
      }
    )
  }

  const resetForm = () => {
    setFormData({
      room_id: '',
      requested_by: '',
      title: '',
      description: '',
      priority: 'medium'
    })
    setUpdateData({
      status: '',
      assigned_to: '',
      cost: '',
      completed_date: ''
    })
    setEditingItem(null)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredMaintenance = maintenance.filter(item => {
    const searchLower = searchTerm.toLowerCase()
    return (
      item.title?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower) ||
      item.room_number?.toLowerCase().includes(searchLower) ||
      `${item.student_first_name} ${item.student_last_name}`.toLowerCase().includes(searchLower)
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
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Maintenance Requests</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage room maintenance and repairs</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          New Request
        </button>
      </div>

      <div className="card">
        <div className="mb-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search maintenance requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="input-field"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Title</th>
                <th className="table-header-cell">Room</th>
                <th className="table-header-cell">Requested By</th>
                <th className="table-header-cell">Priority</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell">Assigned To</th>
                <th className="table-header-cell">Cost</th>
                <th className="table-header-cell">Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              <AnimatePresence>
                {filteredMaintenance.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="table-cell">
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                      </div>
                    </td>
                    <td className="table-cell font-medium">{item.room_number || 'N/A'}</td>
                    <td className="table-cell">
                      {item.student_first_name && item.student_last_name
                        ? `${item.student_first_name} ${item.student_last_name}`
                        : 'N/A'}
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority || 'medium'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status || 'pending'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {item.staff_first_name && item.staff_last_name
                        ? `${item.staff_first_name} ${item.staff_last_name}`
                        : 'Unassigned'}
                    </td>
                    <td className="table-cell">
                      {item.cost ? `RS ${parseFloat(item.cost).toLocaleString()}` : '-'}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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
          {filteredMaintenance.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No maintenance requests found
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
                  {editingItem ? 'Update Maintenance Request' : 'New Maintenance Request'}
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
                {editingItem ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                        <select
                          value={updateData.status}
                          onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                          className="input-field"
                          required
                        >
                          <option value="">Select Status</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                        <select
                          value={updateData.assigned_to}
                          onChange={(e) => setUpdateData({ ...updateData, assigned_to: e.target.value })}
                          className="input-field"
                        >
                          <option value="">Select Staff</option>
                          {staff.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.first_name} {s.last_name} - {s.role}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost (RS)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={updateData.cost}
                          onChange={(e) => setUpdateData({ ...updateData, cost: e.target.value })}
                          className="input-field"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Completed Date</label>
                        <input
                          type="date"
                          value={updateData.completed_date}
                          onChange={(e) => setUpdateData({ ...updateData, completed_date: e.target.value })}
                          className="input-field"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room *</label>
                        <select
                          value={formData.room_id}
                          onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Requested By</label>
                        <select
                          value={formData.requested_by}
                          onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
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
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="input-field"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="input-field"
                          rows="4"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                          className="input-field"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingItem ? 'Update' : 'Create'} Request
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

export default Maintenance

