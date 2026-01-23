import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Search, UserCog, Users, Shield, X } from 'lucide-react'
import { useNotification } from '../context/NotificationContext'

const Staff = () => {
  const { showError, showSuccess, showConfirm } = useNotification()
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
    
    // Validate required fields
    if (!formData.staff_id || formData.staff_id.toString().trim() === '') {
      showError('Please enter a staff ID')
      return
    }
    
    if (!formData.first_name || formData.first_name.trim() === '') {
      showError('Please enter first name')
      return
    }
    
    if (!formData.last_name || formData.last_name.trim() === '') {
      showError('Please enter last name')
      return
    }
    
    if (!formData.email || formData.email.trim() === '') {
      showError('Please enter email address')
      return
    }
    
    // Validate salary if provided (must be positive number)
    if (formData.salary && formData.salary.toString().trim() !== '') {
      const salaryValue = parseFloat(formData.salary)
      if (isNaN(salaryValue) || salaryValue < 0) {
        showError('Salary must be a valid positive number')
        return
      }
    }
    
    // Validate hire_date if provided (must be valid date)
    if (formData.hire_date && formData.hire_date.trim() !== '') {
      const dateValue = new Date(formData.hire_date)
      if (isNaN(dateValue.getTime())) {
        showError('Please enter a valid hire date')
        return
      }
    }
    
    try {
      // Prepare data - convert empty strings to null for optional fields
      const dataToSend = {
        ...formData,
        salary: formData.salary && formData.salary.toString().trim() !== '' ? parseFloat(formData.salary) : null,
        hire_date: formData.hire_date && formData.hire_date.trim() !== '' ? formData.hire_date : null,
        phone: formData.phone && formData.phone.trim() !== '' ? formData.phone : null,
        shift: formData.shift && formData.shift.trim() !== '' ? formData.shift : null
      }
      
      if (editingStaff) {
        await api.put(`/api/staff/${editingStaff.id}`, dataToSend)
      } else {
        await api.post('/api/staff', dataToSend)
      }
      fetchStaff()
      setShowModal(false)
      resetForm()
      showSuccess(editingStaff ? 'Staff member updated successfully' : 'Staff member created successfully')
    } catch (error) {
      showError(error.response?.data?.error || 'Error saving staff member')
    }
  }

  const handleDelete = async (id) => {
    showConfirm(
      'Are you sure you want to delete this staff member?',
      async () => {
        try {
          await api.delete(`/api/staff/${id}`)
          fetchStaff()
          showSuccess('Staff member deleted successfully')
        } catch (error) {
          showError(error.response?.data?.error || 'Error deleting staff member')
        }
      }
    )
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
    security: staff.filter(s => s.role === 'security').length,
    chefs: staff.filter(s => s.role === 'chef').length,
    owners: staff.filter(s => s.role === 'owner').length,
    laundry: staff.filter(s => s.role === 'laundry_staff').length,
    finance: staff.filter(s => s.role === 'finance_officer').length,
    storekeepers: staff.filter(s => s.role === 'storekeeper').length
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Staff Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage wardens, cleaners, and security staff</p>
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
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Staff</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{stats.total}</p>
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
            <option value="chef">Chef</option>
            <option value="owner">Owner</option>
            <option value="laundry_staff">Laundry Staff</option>
            <option value="finance_officer">Finance Officer</option>
            <option value="storekeeper">Storekeeper</option>
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
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="table-cell font-medium">{staffMember.staff_id}</td>
                    <td className="table-cell">{staffMember.first_name} {staffMember.last_name}</td>
                    <td className="table-cell">{staffMember.email}</td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                        staffMember.role === 'warden' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                        staffMember.role === 'cleaner' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                        staffMember.role === 'security' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300' :
                        staffMember.role === 'chef' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                        staffMember.role === 'owner' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                        staffMember.role === 'laundry_staff' ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300' :
                        staffMember.role === 'finance_officer' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300' :
                        staffMember.role === 'storekeeper' ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                      }`}>
                        {staffMember.role?.replace('_', ' ') || 'N/A'}
                      </span>
                    </td>
                    <td className="table-cell">{staffMember.shift || 'N/A'}</td>
                    <td className="table-cell">
                      {staffMember.salary ? `RS${parseFloat(staffMember.salary).toLocaleString()}` : 'N/A'}
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
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(staffMember.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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
                {editingStaff ? 'Edit Staff' : 'Add New Staff'}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Staff ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.staff_id}
                    onChange={(e) => {
                      const value = e.target.value
                      // Only allow positive integers
                      if (value === '' || /^\d+$/.test(value)) {
                        setFormData({ ...formData, staff_id: value })
                      }
                    }}
                    className="input-field"
                    required
                    disabled={!!editingStaff}
                    min="1"
                    placeholder="Enter numeric ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="warden">Warden</option>
                    <option value="cleaner">Cleaner</option>
                    <option value="security">Security Staff</option>
                    <option value="chef">Chef</option>
                    <option value="owner">Owner</option>
                    <option value="laundry_staff">Laundry Staff</option>
                    <option value="finance_officer">Finance Officer</option>
                    <option value="storekeeper">Storekeeper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="input-field"
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="input-field"
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field"
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value
                      // Only allow numbers, spaces, +, -, and parentheses
                      if (value === '' || /^[\d\s\+\-\(\)]+$/.test(value)) {
                        setFormData({ ...formData, phone: value })
                      }
                    }}
                    className="input-field"
                    pattern="[\d\s\+\-\(\)]+"
                    placeholder="e.g., +92 300 1234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shift</label>
                  <input
                    type="text"
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Morning, Evening, Night"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Salary</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => {
                      const value = e.target.value
                      // Allow empty or valid positive numbers
                      if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                        setFormData({ ...formData, salary: value })
                      }
                    }}
                    className="input-field"
                    min="0"
                    step="0.01"
                    placeholder="Enter salary amount"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    Leave empty if salary is not yet determined
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hire Date</label>
                  <input
                    type="date"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    className="input-field"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                    Leave empty if hire date is not yet determined
                  </p>
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
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="submit" className="btn-primary flex-1 order-2 sm:order-1">
                  {editingStaff ? 'Update' : 'Create'} Staff
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

export default Staff

