import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Building2, Users, Home, DollarSign, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

const Hostels = () => {
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm } = useNotification()
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingHostel, setEditingHostel] = useState(null)
  const [stats, setStats] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    total_rooms: '',
    total_capacity: '',
    status: 'active'
  })

  useEffect(() => {
    fetchHostels()
  }, [])

  const fetchHostels = async () => {
    try {
      const response = await api.get('/api/hostels')
      setHostels(response.data)
      
      // Fetch stats for each hostel
      const statsPromises = response.data.map(hostel => 
        api.get(`/api/hostels/${hostel.id}/stats`).then(r => ({ id: hostel.id, ...r.data }))
      )
      const statsData = await Promise.all(statsPromises)
      const statsMap = {}
      statsData.forEach(stat => {
        statsMap[stat.id] = stat
      })
      setStats(statsMap)
    } catch (error) {
      console.error('Error fetching hostels:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingHostel) {
        await api.put(`/api/hostels/${editingHostel.id}`, formData)
      } else {
        await api.post('/api/hostels', formData)
      }
      fetchHostels()
      setShowModal(false)
      resetForm()
      showSuccess(editingHostel ? 'Hostel updated successfully' : 'Hostel created successfully')
    } catch (error) {
      showError(error.response?.data?.error || 'Error saving hostel')
    }
  }

  const handleDelete = async (id) => {
    showConfirm(
      'Are you sure you want to delete this hostel? This will delete all associated data!',
      async () => {
        try {
          await api.delete(`/api/hostels/${id}`)
          fetchHostels()
          showSuccess('Hostel deleted successfully')
        } catch (error) {
          showError(error.response?.data?.error || 'Error deleting hostel')
        }
      }
    )
  }

  const handleEdit = (hostel) => {
    setEditingHostel(hostel)
    setFormData({
      name: hostel.name,
      address: hostel.address || '',
      phone: hostel.phone || '',
      email: hostel.email || '',
      total_rooms: hostel.total_rooms || '',
      total_capacity: hostel.total_capacity || '',
      status: hostel.status || 'active'
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      phone: '',
      email: '',
      total_rooms: '',
      total_capacity: '',
      status: 'active'
    })
    setEditingHostel(null)
  }

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Access denied. Super admin only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Hostel Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all hostels in the system</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Hostel
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hostels.map((hostel, index) => (
            <motion.div
              key={hostel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:scale-105 transition-transform duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <Building2 size={24} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">{hostel.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      hostel.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {hostel.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(hostel)}
                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(hostel.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {hostel.address && (
                <p className="text-sm text-gray-600 mb-4">{hostel.address}</p>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                    <Users size={16} />
                    Students
                  </div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{stats[hostel.id]?.students || 0}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                    <Home size={16} />
                    Rooms
                  </div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{stats[hostel.id]?.rooms || 0}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                    <Users size={16} />
                    Staff
                  </div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{stats[hostel.id]?.staff || 0}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm mb-1">
                    <DollarSign size={16} />
                    Revenue
                  </div>
                  <p className="text-lg font-bold text-gray-800 dark:text-gray-100">RS{stats[hostel.id]?.revenue?.toLocaleString() || 0}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={() => {
            setShowModal(false)
            resetForm()
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
                {editingHostel ? 'Edit Hostel' : 'Add New Hostel'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  resetForm()
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95"
                aria-label="Close modal"
              >
                <X size={24} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Hostel Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter hostel name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Enter hostel address"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                    placeholder="e.g., +92 300 1234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    placeholder="e.g., hostel@example.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Rooms</label>
                  <input
                    type="number"
                    value={formData.total_rooms}
                    onChange={(e) => setFormData({ ...formData, total_rooms: e.target.value })}
                    className="input-field"
                    min="0"
                    placeholder="Enter number of rooms"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Total Capacity</label>
                  <input
                    type="number"
                    value={formData.total_capacity}
                    onChange={(e) => setFormData({ ...formData, total_capacity: e.target.value })}
                    className="input-field"
                    min="0"
                    placeholder="Enter total capacity"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input-field"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="submit" className="btn-primary flex-1 order-2 sm:order-1">
                  {editingHostel ? 'Update' : 'Create'} Hostel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="btn-secondary flex-1 order-1 sm:order-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Hostels

