import { useState, useEffect } from 'react'
import api from '../config/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Search, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

const Students = () => {
  const { user } = useAuth()
  const { showError, showSuccess } = useNotification()
  const [students, setStudents] = useState([])
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
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
    status: 'active',
    hostel_id: ''
  })

  useEffect(() => {
    fetchStudents()
    if (user?.role === 'super_admin') {
      fetchHostels()
    }
  }, [user])

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
      // Determine hostel_id: use formData.hostel_id for super_admin, otherwise use user's hostel_id
      const finalHostelId = user?.role === 'super_admin' 
        ? (formData.hostel_id ? parseInt(formData.hostel_id) : null)
        : (user?.hostel_id || null)

      // Normalize date_of_birth - convert empty string to null
      const normalizedDateOfBirth = formData.date_of_birth && formData.date_of_birth.trim() !== '' 
        ? formData.date_of_birth 
        : null

      // Validate date if provided
      if (normalizedDateOfBirth) {
        const date = new Date(normalizedDateOfBirth)
        if (isNaN(date.getTime())) {
          alert('Please enter a valid date of birth or leave it empty.')
          return
        }
      }

      const submitData = {
        ...formData,
        date_of_birth: normalizedDateOfBirth,
        hostel_id: finalHostelId,
        // Normalize other optional fields
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        course: formData.course?.trim() || null,
        gender: formData.gender || null,
        year_of_study: formData.year_of_study || null,
      }

      if (editingStudent) {
        await api.put(`/api/students/${editingStudent.id}`, submitData)
        showSuccess('Student updated successfully!')
      } else {
        await api.post('/api/students', submitData)
        showSuccess('Student created successfully!')
      }
      fetchStudents()
      setShowModal(false)
      resetForm()
    } catch (error) {
      // Extract user-friendly error message
      let errorMessage = 'An error occurred while saving the student. Please try again.'
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        // Convert technical errors to user-friendly messages
        if (error.message.includes('date') || error.message.includes('invalid input syntax')) {
          errorMessage = 'Invalid date format. Please enter a valid date of birth or leave it empty.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else {
          errorMessage = error.message
        }
      }
      
      console.error('Error saving student:', error)
      showError(errorMessage)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await api.delete(`/api/students/${id}`)
        fetchStudents()
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting student')
      }
    }
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
      status: student.status || 'active',
      hostel_id: student.hostel_id || ''
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
      status: 'active',
      hostel_id: ''
    })
    setEditingStudent(null)
  }

  const filteredStudents = students.filter(student =>
    `${student.first_name} ${student.last_name} ${student.student_id} ${student.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header Section - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2">
            Student Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage all student records
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] sm:min-h-[44px] text-sm sm:text-base shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={20} className="sm:w-5 sm:h-5" />
          <span className="sm:inline">Add Student</span>
        </button>
      </div>

      {/* Search and Content Card */}
      <div className="card p-4 sm:p-6">
        {/* Search Bar - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 sm:pl-12 text-base sm:text-sm min-h-[48px] sm:min-h-[44px]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12 sm:py-16">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">
              No students found
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block table-container">
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
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="table-cell font-medium">{student.student_id}</td>
                        <td className="table-cell">{student.first_name} {student.last_name}</td>
                        <td className="table-cell">{student.email}</td>
                        <td className="table-cell">{student.course || 'N/A'}</td>
                        <td className="table-cell">{student.room_number || 'N/A'}</td>
                        <td className="table-cell">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            student.status === 'active' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(student)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                              aria-label="Edit student"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                              aria-label="Delete student"
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

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              <AnimatePresence>
                {filteredStudents.map((student, index) => (
                  <motion.div
                    key={student.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md dark:shadow-gray-900/50 p-4 sm:p-5 border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/70 transition-all duration-200"
                  >
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
                          {student.first_name} {student.last_name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          ID: {student.student_id}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                        student.status === 'active' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                      }`}>
                        {student.status}
                      </span>
                    </div>

                    {/* Card Details */}
                    <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-5">
                      <div className="flex items-start gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[80px] sm:min-w-[90px]">
                          Email:
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 break-all flex-1">
                          {student.email}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[80px] sm:min-w-[90px]">
                          Course:
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          {student.course || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[80px] sm:min-w-[90px]">
                          Room:
                        </span>
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {student.room_number || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleEdit(student)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium text-sm sm:text-base hover:bg-blue-100 dark:hover:bg-blue-900/30 active:scale-95 transition-all min-h-[44px] sm:min-h-[48px]"
                      >
                        <Edit size={18} className="sm:w-5 sm:h-5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium text-sm sm:text-base hover:bg-red-100 dark:hover:bg-red-900/30 active:scale-95 transition-all min-h-[44px] sm:min-h-[48px]"
                      >
                        <Trash2 size={18} className="sm:w-5 sm:h-5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-3 sm:p-4 z-50"
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
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4 sm:mb-6 sticky top-0 bg-white dark:bg-gray-800 pb-2 sm:pb-0 z-10">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
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

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Student ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.student_id}
                      onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                      className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                      required
                      disabled={!!editingStudent}
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Course
                    </label>
                    <input
                      type="text"
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Year of Study
                    </label>
                    <input
                      type="number"
                      value={formData.year_of_study}
                      onChange={(e) => setFormData({ ...formData, year_of_study: e.target.value })}
                      className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                      min="1"
                      max="5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  {user?.role === 'super_admin' && (
                    <div className="sm:col-span-2">
                      <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                        Hostel <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.hostel_id}
                        onChange={(e) => setFormData({ ...formData, hostel_id: e.target.value })}
                        className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                        required
                      >
                        <option value="">Select Hostel</option>
                        {hostels.filter(h => h.status === 'active').map(hostel => (
                          <option key={hostel.id} value={hostel.id}>
                            {hostel.name}
                          </option>
                        ))}
                      </select>
                      {!formData.hostel_id && (
                        <p className="text-red-500 dark:text-red-400 text-xs sm:text-sm mt-1.5">
                          Please select a hostel
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field text-base sm:text-sm min-h-[100px] sm:min-h-[80px]"
                    rows="3"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    type="submit" 
                    className="btn-primary flex-1 min-h-[48px] sm:min-h-[44px] text-base sm:text-base font-semibold shadow-lg active:scale-95 transition-transform"
                  >
                    {editingStudent ? 'Update' : 'Create'} Student
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Students

