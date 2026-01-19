import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Search, UserCog, Users, Shield } from 'lucide-react'

const Staff = () => {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [formData, setFormData] = useState({
    staff_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'warden',
    shift: '',
    salary: '',
    hire_date: '',
    status: 'active'
  })

  useEffect(() => {
    fetchStaff()
  }, [filter])

  const fetchStaff = async () => {
    try {
      const params = filter !== 'all' ? { role: filter } : {}
      const response = await api.get('/api/staff', { params })
      setStaff(response.data)
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingStaff) {
        await api.put(`/api/staff/${editingStaff.id}`, formData)
      } else {
        await api.post('/api/staff', formData)
      }
      fetchStaff()
      setShowModal(false)
      resetForm()
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving staff member')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await api.delete(`/api/staff/${id}`)
        fetchStaff()
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting staff member')
      }
    }
  }

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember)
    setFormData({
      staff_id: staffMember.staff_id,
      first_name: staffMember.first_name,
      last_name: staffMember.last_name,
      email: staffMember.email,
      phone: staffMember.phone || '',
      role: staffMember.role,
      shift: staffMember.shift || '',
      salary: staffMember.salary || '',
      hire_date: staffMember.hire_date || '',
      status: staffMember.status || 'active'
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      staff_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'warden',
      shift: '',
      salary: '',
      hire_date: '',
      status: 'active'
    })
    setEditingStaff(null)
  }

  const filteredStaff = staff.filter(staffMember =>
    `${staffMember.first_name} ${staffMember.last_name} ${staffMember.staff_id} ${staffMember.email} ${staffMember.role}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: staff.length,
    wardens: staff.filter(s => s.role === 'warden').length,
    cleaners: staff.filter(s => s.role === 'cleaner').length,
    security: staff.filter(s => s.role === 'security').length
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Staff Management</h1>
          <p className="text-gray-600">Manage wardens, cleaners, and security staff</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-gray-600 text-sm mb-1">Total Staff</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <UserCog size={20} className="text-blue-600" />
            <p className="text-gray-600 text-sm">Wardens</p>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.wardens}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <Users size={20} className="text-green-600" />
            <p className="text-gray-600 text-sm">Cleaners</p>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.cleaners}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={20} className="text-orange-600" />
            <p className="text-gray-600 text-sm">Security</p>
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats.security}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search staff..."
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
            <option value="all">All Roles</option>
            <option value="warden">Wardens</option>
            <option value="cleaner">Cleaners</option>
            <option value="security">Security</option>
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
                  <th className="table-header-cell">Staff ID</th>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">Email</th>
                  <th className="table-header-cell">Role</th>
                  <th className="table-header-cell">Shift</th>
                  <th className="table-header-cell">Salary</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredStaff.map((staffMember, index) => (
                  <motion.tr
                    key={staffMember.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="table-cell font-medium">{staffMember.staff_id}</td>
                    <td className="table-cell">{staffMember.first_name} {staffMember.last_name}</td>
                    <td className="table-cell">{staffMember.email}</td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        staffMember.role === 'warden' ? 'bg-blue-100 text-blue-800' :
                        staffMember.role === 'cleaner' ? 'bg-green-100 text-green-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {staffMember.role}
                      </span>
                    </td>
                    <td className="table-cell">{staffMember.shift || 'N/A'}</td>
                    <td className="table-cell">
                      {staffMember.salary ? `₹${parseFloat(staffMember.salary).toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        staffMember.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {staffMember.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(staffMember)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(staffMember.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
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
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingStaff ? 'Edit Staff' : 'Add New Staff'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID *</label>
                  <input
                    type="text"
                    value={formData.staff_id}
                    onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                    className="input-field"
                    required
                    disabled={!!editingStaff}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="warden">Warden</option>
                    <option value="cleaner">Cleaner</option>
                    <option value="security">Security Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                  <input
                    type="text"
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Morning, Evening, Night"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    className="input-field"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingStaff ? 'Update' : 'Create'} Staff
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

export default Staff

