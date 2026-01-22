import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion } from 'framer-motion'
import { Plus, Edit, AlertCircle, Wrench, Search, Filter, X } from 'lucide-react'
import { useNotification } from '../context/NotificationContext'

const Complaints = () => {
  const [complaints, setComplaints] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [students, setStudents] = useState([])
  const [staff, setStaff] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('complaints')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [formData, setFormData] = useState({
    student_id: '',
    title: '',
    description: '',
    category: '',
    priority: 'medium'
  })
  const [maintenanceData, setMaintenanceData] = useState({
    room_id: '',
    requested_by: '',
    title: '',
    description: '',
    priority: 'medium'
  })

  useEffect(() => {
    fetchComplaints()
    fetchMaintenance()
    fetchStudents()
    fetchStaff()
    fetchRooms()
  }, [filter, activeTab])

  const fetchComplaints = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await api.get('/api/complaints', { params })
      setComplaints(response.data)
    } catch (error) {
      console.error('Error fetching complaints:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMaintenance = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {}
      const response = await api.get('/api/complaints/maintenance/all', { params })
      setMaintenance(response.data)
    } catch (error) {
      console.error('Error fetching maintenance:', error)
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

  const handleComplaintSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await api.put(`/api/complaints/${editingItem.id}`, formData)
      } else {
        await api.post('/api/complaints', formData)
      }
      fetchComplaints()
      setShowModal(false)
      resetForm()
      showSuccess(editingItem ? 'Complaint updated successfully' : 'Complaint created successfully')
    } catch (error) {
      showError(error.response?.data?.error || 'Error saving complaint')
    }
  }

  const handleMaintenanceSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingItem) {
        await api.put(`/api/complaints/maintenance/${editingItem.id}`, maintenanceData)
      } else {
        await api.post('/api/complaints/maintenance', maintenanceData)
      }
      fetchMaintenance()
      setShowModal(false)
      resetMaintenanceForm()
      showSuccess(editingItem ? 'Maintenance request updated successfully' : 'Maintenance request created successfully')
    } catch (error) {
      showError(error.response?.data?.error || 'Error saving maintenance request')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    if (activeTab === 'complaints') {
      setFormData({
        student_id: item.student_id,
        title: item.title,
        description: item.description,
        category: item.category,
        priority: item.priority
      })
    } else {
      setMaintenanceData({
        room_id: item.room_id,
        requested_by: item.requested_by,
        title: item.title,
        description: item.description,
        priority: item.priority
      })
    }
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      student_id: '',
      title: '',
      description: '',
      category: '',
      priority: 'medium'
    })
    setEditingItem(null)
  }

  const resetMaintenanceForm = () => {
    setMaintenanceData({
      room_id: '',
      requested_by: '',
      title: '',
      description: '',
      priority: 'medium'
    })
    setEditingItem(null)
  }

  const filteredComplaints = complaints.filter(complaint =>
    `${complaint.title} ${complaint.first_name} ${complaint.last_name} ${complaint.category}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const filteredMaintenance = maintenance.filter(item =>
    `${item.title} ${item.room_number}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const { showError, showSuccess } = useNotification()

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2">
            Complaints & Maintenance
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage complaints and maintenance requests
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            resetMaintenanceForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] sm:min-h-[44px] text-sm sm:text-base shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          <span>Add {activeTab === 'complaints' ? 'Complaint' : 'Maintenance Request'}</span>
        </button>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-3 sm:px-4 py-2.5 sm:py-2 font-medium transition-colors border-b-2 whitespace-nowrap min-h-[48px] sm:min-h-[44px] flex items-center gap-2 ${
            activeTab === 'complaints'
              ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <AlertCircle size={18} className="sm:w-5 sm:h-5" />
          <span>Complaints</span>
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-3 sm:px-4 py-2.5 sm:py-2 font-medium transition-colors border-b-2 whitespace-nowrap min-h-[48px] sm:min-h-[44px] flex items-center gap-2 ${
            activeTab === 'maintenance'
              ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Wrench size={18} className="sm:w-5 sm:h-5" />
          <span>Maintenance</span>
        </button>
      </div>

      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
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
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block table-container">
              <table className="table">
              <thead className="table-header">
                {activeTab === 'complaints' ? (
                  <tr>
                    <th className="table-header-cell">Title</th>
                    <th className="table-header-cell">Student</th>
                    <th className="table-header-cell">Category</th>
                    <th className="table-header-cell">Priority</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Assigned To</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="table-header-cell">Title</th>
                    <th className="table-header-cell">Room</th>
                    <th className="table-header-cell">Requested By</th>
                    <th className="table-header-cell">Priority</th>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Assigned To</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                )}
              </thead>
              <tbody className="table-body">
                {(activeTab === 'complaints' ? filteredComplaints : filteredMaintenance).map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="table-cell font-medium">{item.title}</td>
                    {activeTab === 'complaints' ? (
                      <>
                        <td className="table-cell">{item.first_name} {item.last_name}</td>
                        <td className="table-cell">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {item.category}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="table-cell font-medium">{item.room_number}</td>
                        <td className="table-cell">
                          {item.student_first_name} {item.student_last_name || 'N/A'}
                        </td>
                      </>
                    )}
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.priority === 'high' ? 'bg-red-100 text-red-800' :
                        item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'resolved' || item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      {item.staff_first_name ? `${item.staff_first_name} ${item.staff_last_name}` : 'Unassigned'}
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              {(activeTab === 'complaints' ? filteredComplaints : filteredMaintenance).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-900/50 p-4 sm:p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/70 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 break-words">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {activeTab === 'complaints' 
                          ? `${item.first_name} ${item.last_name}`
                          : `Room ${item.room_number}`
                        }
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0 ml-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        item.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' :
                        item.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                        'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                      }`}>
                        {item.priority}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        item.status === 'resolved' || item.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        item.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                        'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-5">
                    {activeTab === 'complaints' && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[80px] sm:min-w-[90px]">
                          Category:
                        </span>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                          {item.category || 'N/A'}
                        </span>
                      </div>
                    )}
                    {activeTab === 'maintenance' && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[80px] sm:min-w-[90px]">
                          Requested By:
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          {item.student_first_name} {item.student_last_name || 'N/A'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[80px] sm:min-w-[90px]">
                        Assigned To:
                      </span>
                      <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {item.staff_first_name ? `${item.staff_first_name} ${item.staff_last_name}` : 'Unassigned'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleEdit(item)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium text-sm sm:text-base hover:bg-blue-100 dark:hover:bg-blue-900/30 active:scale-95 transition-all min-h-[44px] sm:min-h-[48px]"
                  >
                    <Edit size={18} className="sm:w-5 sm:h-5" />
                    <span>Edit</span>
                  </button>
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
            resetForm()
            resetMaintenanceForm()
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6 sticky top-0 bg-white dark:bg-gray-800 pb-2 sm:pb-0 z-10">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                {editingItem ? 'Edit' : 'Add New'} {activeTab === 'complaints' ? 'Complaint' : 'Maintenance Request'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                  resetMaintenanceForm()
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95"
                aria-label="Close modal"
              >
                <X size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            {activeTab === 'complaints' ? (
              <form onSubmit={handleComplaintSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Student <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.student_id}
                    onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
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
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field text-base sm:text-sm min-h-[100px] sm:min-h-[80px]"
                    rows="4"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                    >
                      <option value="">Select Category</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="cleanliness">Cleanliness</option>
                      <option value="security">Security</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    type="submit" 
                    className="btn-primary flex-1 min-h-[48px] sm:min-h-[44px] text-base sm:text-base font-semibold shadow-lg active:scale-95 transition-transform"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="btn-secondary flex-1 min-h-[48px] sm:min-h-[44px] text-base sm:text-base font-semibold active:scale-95 transition-transform"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room *</label>
                  <select
                    value={maintenanceData.room_id}
                    onChange={(e) => setMaintenanceData({ ...maintenanceData, room_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Room</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.room_number}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requested By</label>
                  <select
                    value={maintenanceData.requested_by}
                    onChange={(e) => setMaintenanceData({ ...maintenanceData, requested_by: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Student</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.first_name} {student.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input
                    type="text"
                    value={maintenanceData.title}
                    onChange={(e) => setMaintenanceData({ ...maintenanceData, title: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                  <textarea
                    value={maintenanceData.description}
                    onChange={(e) => setMaintenanceData({ ...maintenanceData, description: e.target.value })}
                    className="input-field"
                    rows="4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={maintenanceData.priority}
                    onChange={(e) => setMaintenanceData({ ...maintenanceData, priority: e.target.value })}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">Save</button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetMaintenanceForm()
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Complaints

