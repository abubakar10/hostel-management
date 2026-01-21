import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, X, Download, Upload, Filter } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { exportToCSV, exportToExcel, parseCSV, formatStudentsForExport } from '../utils/exportUtils'

const Students = () => {
  const { user } = useAuth()
  const { showError, showSuccess, showWarning, showConfirm } = useNotification()
  const [students, setStudents] = useState([])
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    course: '',
    room: '',
    gender: 'all'
  })
  const [rooms, setRooms] = useState([])
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    course: '',
    year_of_study: '',
    room_id: null,
    hostel_id: '',
    status: 'active'
  })

  useEffect(() => {
    fetchStudents()
    fetchRooms()
    if (user?.role === 'super_admin') {
      fetchHostels()
    }
  }, [user])

  const fetchRooms = async () => {
    try {
      const response = await api.get('/api/rooms')
      setRooms(response.data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await api.get('/api/students')
      setStudents(response.data)
    } catch (error) {
      console.error('Error fetching students:', error)
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
      // Prepare submit data - remove hostel_id from formData first
      const { hostel_id: formHostelId, ...restFormData } = formData
      const submitData = { ...restFormData }
      
      // Determine hostel_id to use
      let finalHostelId = null
      if (user?.role === 'super_admin') {
        // Super admin must select a hostel from the dropdown
        finalHostelId = formHostelId || null
      } else {
        // Regular admins use their assigned hostel
        finalHostelId = user?.hostel_id || null
      }
      
      // Validate that we have a hostel_id
      if (!finalHostelId) {
        if (user?.role === 'super_admin') {
          showWarning('Please select a hostel.')
        } else {
          showError('Your account does not have a hostel assigned. Please contact an administrator.')
        }
        return
      }
      
      submitData.hostel_id = finalHostelId

      if (editingStudent) {
        await api.put(`/api/students/${editingStudent.id}`, submitData)
      } else {
        await api.post('/api/students', submitData)
      }
      fetchStudents()
      setShowModal(false)
      resetForm()
    } catch (error) {
      // Don't show alert for auth errors (401/403) - interceptor will redirect
      if (error.response?.status === 401 || error.response?.status === 403) {
        return; // Let the interceptor handle the redirect
      }
      const errorMessage = error.response?.data?.error || error.message || 'Error saving student'
      console.error('Error saving student:', error)
      showError(errorMessage)
    }
  }

  const handleDelete = async (id) => {
    showConfirm(
      'Are you sure you want to delete this student?',
      async () => {
        try {
          await api.delete(`/api/students/${id}`)
          fetchStudents()
          showSuccess('Student deleted successfully')
        } catch (error) {
          showError(error.response?.data?.error || 'Error deleting student')
        }
      }
    )
  }

  const handleEdit = (student) => {
    setEditingStudent(student)
    setFormData({
      student_id: student.student_id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone || '',
      address: student.address || '',
      date_of_birth: student.date_of_birth || '',
      gender: student.gender || '',
      course: student.course || '',
      year_of_study: student.year_of_study || '',
      room_id: student.room_id || null,
      hostel_id: student.hostel_id || '',
      status: student.status || 'active'
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      student_id: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      date_of_birth: '',
      gender: '',
      course: '',
      year_of_study: '',
      room_id: null,
      hostel_id: '',
      status: 'active'
    })
    setEditingStudent(null)
  }

  const handleExport = (format = 'csv') => {
    const dataToExport = filteredStudents
    const formatted = formatStudentsForExport(dataToExport)
    if (format === 'csv') {
      exportToCSV(formatted, 'students')
    } else {
      exportToExcel(formatted, 'students')
    }
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const csvData = await parseCSV(file)
      // Process and import students
      let successCount = 0
      let errorCount = 0
      
      for (const row of csvData) {
        try {
          const studentData = {
            student_id: row['Student ID'] || row['student_id'],
            first_name: row['First Name'] || row['first_name'],
            last_name: row['Last Name'] || row['last_name'],
            email: row['Email'] || row['email'],
            phone: row['Phone'] || row['phone'] || '',
            address: row['Address'] || row['address'] || '',
            date_of_birth: row['Date of Birth'] || row['date_of_birth'] || '',
            gender: row['Gender'] || row['gender'] || '',
            course: row['Course'] || row['course'] || '',
            year_of_study: row['Year of Study'] || row['year_of_study'] || '',
            status: row['Status'] || row['status'] || 'active',
            hostel_id: user?.hostel_id || null
          }

          await api.post('/api/students', studentData)
          successCount++
        } catch (error) {
          console.error('Error importing student:', error)
          errorCount++
        }
      }

      if (errorCount > 0) {
        showWarning(`Import completed: ${successCount} successful, ${errorCount} failed`)
      } else {
        showSuccess(`Import completed: ${successCount} students imported successfully`)
      }
      fetchStudents()
      e.target.value = '' // Reset file input
    } catch (error) {
      showError('Error parsing CSV file: ' + error.message)
    }
  }

  const filteredStudents = students.filter(student => {
    // Text search
    const matchesSearch = !searchTerm || 
      `${student.first_name} ${student.last_name} ${student.student_id} ${student.email} ${student.phone}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

    // Status filter
    const matchesStatus = filters.status === 'all' || student.status === filters.status

    // Course filter
    const matchesCourse = !filters.course || 
      (student.course && student.course.toLowerCase().includes(filters.course.toLowerCase()))

    // Room filter
    const matchesRoom = !filters.room || 
      (student.room_number && student.room_number.toLowerCase().includes(filters.room.toLowerCase()))

    // Gender filter
    const matchesGender = filters.gender === 'all' || student.gender === filters.gender

    return matchesSearch && matchesStatus && matchesCourse && matchesRoom && matchesGender
  })

  const uniqueCourses = [...new Set(students.map(s => s.course).filter(Boolean))]
  const uniqueRooms = [...new Set(students.map(s => s.room_number).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Student Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all student records</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Student
        </button>
      </div>

      <div className="card">
        <div className="mb-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, ID, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`btn-secondary flex items-center gap-2 ${showAdvancedFilters ? 'bg-primary-100' : ''}`}
              >
                <Filter size={18} />
                Filters
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="btn-secondary flex items-center gap-2"
              >
                <Download size={18} />
                Export CSV
              </button>
              <label className="btn-secondary flex items-center gap-2 cursor-pointer">
                <Upload size={18} />
                Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input-field"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <input
                  type="text"
                  placeholder="Filter by course..."
                  value={filters.course}
                  onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                  className="input-field"
                  list="courses"
                />
                <datalist id="courses">
                  {uniqueCourses.map(course => (
                    <option key={course} value={course} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <input
                  type="text"
                  placeholder="Filter by room..."
                  value={filters.room}
                  onChange={(e) => setFilters({ ...filters, room: e.target.value })}
                  className="input-field"
                  list="rooms"
                />
                <datalist id="rooms">
                  {uniqueRooms.map(room => (
                    <option key={room} value={room} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  className="input-field"
                >
                  <option value="all">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </motion.div>
          )}
        </div>

        {!loading && (
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredStudents.length} of {students.length} students
            {(filters.status !== 'all' || filters.course || filters.room || filters.gender || searchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFilters({ status: 'all', course: '', room: '', gender: 'all' })
                }}
                className="ml-2 text-primary-600 hover:text-primary-700 underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">ID</th>
                  <th className="table-header-cell">Name</th>
                  <th className="table-header-cell">Email</th>
                  <th className="table-header-cell">Course</th>
                  <th className="table-header-cell">Room</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                <AnimatePresence>
                  {filteredStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="table-cell font-medium">{student.student_id}</td>
                      <td className="table-cell">{student.first_name} {student.last_name}</td>
                      <td className="table-cell">{student.email}</td>
                      <td className="table-cell">{student.course}</td>
                      <td className="table-cell">{student.room_number || 'N/A'}</td>
                      <td className="table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
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
              className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-full sm:max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto modal-content"
            >
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
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
                {user?.role === 'super_admin' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hostel *</label>
                    <select
                      value={formData.hostel_id}
                      onChange={(e) => setFormData({ ...formData, hostel_id: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select Hostel</option>
                      {hostels.filter(h => h.status === 'active').map(hostel => (
                        <option key={hostel.id} value={hostel.id}>
                          {hostel.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student ID *</label>
                    <input
                      type="number"
                      value={formData.student_id}
                      onChange={(e) => {
                        const value = e.target.value
                        // Only allow positive integers
                        if (value === '' || /^\d+$/.test(value)) {
                          setFormData({ ...formData, student_id: value })
                        }
                      }}
                      className="input-field"
                      required
                      disabled={!!editingStudent}
                      min="1"
                      placeholder="Enter numeric ID"
                    />
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                    <input
                      type="text"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year of Study</label>
                    <input
                      type="number"
                      value={formData.year_of_study}
                      onChange={(e) => setFormData({ ...formData, year_of_study: e.target.value })}
                      className="input-field"
                      min="1"
                      max="5"
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field"
                    rows="3"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1 min-h-[44px] text-sm sm:text-base">
                    {editingStudent ? 'Update' : 'Create'} Student
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="btn-secondary flex-1 min-h-[44px] text-sm sm:text-base"
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

export default Students

