import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, UserPlus, Shield, Building2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

const Users = () => {
  const { user } = useAuth()
  const { showError, showSuccess, showConfirm } = useNotification()
  const [users, setUsers] = useState([])
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin',
    hostel_id: ''
  })

  useEffect(() => {
    fetchUsers()
    fetchHostels()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHostels = async () => {
    try {
      const response = await api.get('/api/hostels')
      setHostels(response.data)
    } catch (error) {
      console.error('Error fetching hostels:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Convert hostel_id to integer if it's a string
      const submitData = {
        ...formData,
        hostel_id: formData.hostel_id ? parseInt(formData.hostel_id) : null
      }

      if (editingUser) {
        await api.put(`/api/users/${editingUser.id}`, submitData)
      } else {
        await api.post('/api/users', submitData)
      }
      fetchUsers()
      setShowModal(false)
      resetForm()
      showSuccess(editingUser ? 'User updated successfully' : 'User created successfully')
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || 'Error saving user'
      console.error('Error details:', error.response?.data)
      showError(errorMessage)
    }
  }

  const handleDelete = async (id) => {
    showConfirm(
      'Are you sure you want to delete this user?',
      async () => {
        try {
          await api.delete(`/api/users/${id}`)
          fetchUsers()
          showSuccess('User deleted successfully')
        } catch (error) {
          showError(error.response?.data?.error || 'Error deleting user')
        }
      }
    )
  }

  const handleEdit = (userData) => {
    setEditingUser(userData)
    setFormData({
      username: userData.username,
      email: userData.email,
      password: '',
      role: userData.role,
      hostel_id: userData.hostel_id || ''
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'admin',
      hostel_id: ''
    })
    setEditingUser(null)
  }

  if (user?.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Access denied. Super admin only.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">User Management</h1>
          <p className="text-gray-600">Create and manage hostel admin users</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Username</th>
                  <th className="table-header-cell">Email</th>
                  <th className="table-header-cell">Role</th>
                  <th className="table-header-cell">Hostel</th>
                  <th className="table-header-cell">Created</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {users.map((userItem, index) => (
                  <motion.tr
                    key={userItem.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="table-cell font-medium">{userItem.username}</td>
                    <td className="table-cell">{userItem.email}</td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userItem.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {userItem.role}
                      </span>
                    </td>
                    <td className="table-cell">
                      {userItem.hostel_name || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="table-cell">
                      {new Date(userItem.created_at).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(userItem)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        {userItem.id !== user.id && (
                          <button
                            onClick={() => handleDelete(userItem.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 size={18} />
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
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {editingUser ? 'Edit User' : 'Create Hostel Admin'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field"
                  required={!editingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value, hostel_id: e.target.value === 'super_admin' ? '' : formData.hostel_id })}
                  className="input-field"
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {formData.role !== 'super_admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hostel *</label>
                  <select
                    value={formData.hostel_id}
                    onChange={(e) => setFormData({ ...formData, hostel_id: e.target.value })}
                    className="input-field"
                    required={formData.role !== 'super_admin'}
                  >
                    <option value="">Select Hostel</option>
                    {hostels.filter(h => h.status === 'active').map(hostel => (
                      <option key={hostel.id} value={hostel.id}>
                        {hostel.name}
                      </option>
                    ))}
                  </select>
                  {formData.role !== 'super_admin' && !formData.hostel_id && (
                    <p className="text-red-500 text-xs mt-1">Please select a hostel</p>
                  )}
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingUser ? 'Update' : 'Create'} User
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
    </div>
  )
}

export default Users

