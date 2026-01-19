import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion } from 'framer-motion'
import { Plus, Edit, AlertCircle, Wrench, Search, Filter } from 'lucide-react'

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
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving complaint')
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
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving maintenance request')
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Complaints & Maintenance</h1>
          <p className="text-gray-600">Manage complaints and maintenance requests</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            resetMaintenanceForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add {activeTab === 'complaints' ? 'Complaint' : 'Maintenance Request'}
        </button>
      </div>

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('complaints')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'complaints'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <AlertCircle size={20} className="inline mr-2" />
          Complaints
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'maintenance'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <Wrench size={20} className="inline mr-2" />
          Maintenance
        </button>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
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
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
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
                    className="hover:bg-gray-50"
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
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit size={18} />
                      </button>
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
          onClick={() => {
            setShowModal(false)
            resetForm()
            resetMaintenanceForm()
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingItem ? 'Edit' : 'Add New'} {activeTab === 'complaints' ? 'Complaint' : 'Maintenance Request'}
            </h2>
            {activeTab === 'complaints' ? (
              <form onSubmit={handleComplaintSubmit} className="space-y-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field"
                    rows="4"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Category</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="cleanliness">Cleanliness</option>
                      <option value="security">Security</option>
                      <option value="other">Other</option>
                    </select>
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
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">Save</button>
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
            ) : (
              <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requested By</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={maintenanceData.title}
                    onChange={(e) => setMaintenanceData({ ...maintenanceData, title: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
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

