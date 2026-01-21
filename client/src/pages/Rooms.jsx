import { useState, useEffect, useRef } from 'react'
import api from '../config/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Search, X, Users } from 'lucide-react'
import { useNotification } from '../context/NotificationContext'

const Rooms = () => {
  const { showError, showSuccess } = useNotification()
  const [rooms, setRooms] = useState([])
  const [roomTypes, setRoomTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAllocationModal, setShowAllocationModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    room_number: '',
    room_type_id: '',
    floor: '',
    capacity: '',
    status: 'available',
    amenities: []
  })
  const [allocationData, setAllocationData] = useState({
    student_id: '',
    room_id: ''
  })
  const [students, setStudents] = useState([])
  const [studentSearchTerm, setStudentSearchTerm] = useState('')
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const studentDropdownRef = useRef(null)

  useEffect(() => {
    fetchRooms()
    fetchRoomTypes()
    fetchStudents()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (studentDropdownRef.current && !studentDropdownRef.current.contains(event.target)) {
        setShowStudentDropdown(false)
      }
    }

    if (showStudentDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStudentDropdown])

  const fetchRooms = async () => {
    try {
      const response = await api.get('/api/rooms')
      setRooms(response.data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoomTypes = async () => {
    try {
      const response = await api.get('/api/rooms/types/all')
      setRoomTypes(response.data)
    } catch (error) {
      console.error('Error fetching room types:', error)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate capacity against room type capacity
    if (formData.room_type_id) {
      const selectedRoomType = roomTypes.find(type => type.id === parseInt(formData.room_type_id))
      if (selectedRoomType && parseInt(formData.capacity) > selectedRoomType.capacity) {
        showError(`Room capacity cannot exceed the room type capacity of ${selectedRoomType.capacity}`)
        return
      }
    }
    
    try {
      if (editingRoom) {
        await api.put(`/api/rooms/${editingRoom.id}`, formData)
      } else {
        await api.post('/api/rooms', formData)
      }
      fetchRooms()
      setShowModal(false)
      resetForm()
      showSuccess(editingRoom ? 'Room updated successfully' : 'Room created successfully')
    } catch (error) {
      showError(error.response?.data?.error || 'Error saving room')
    }
  }

  const handleAllocate = async (e) => {
    e.preventDefault()
    if (!allocationData.student_id) {
      showError('Please select a student')
      return
    }
    try {
      await api.post('/api/rooms/allocate', allocationData)
      fetchRooms()
      fetchStudents()
      setShowAllocationModal(false)
      setAllocationData({ student_id: '', room_id: '' })
      setStudentSearchTerm('')
      setShowStudentDropdown(false)
      showSuccess('Room allocated successfully!')
    } catch (error) {
      showError(error.response?.data?.error || 'Error allocating room')
    }
  }

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    if (!studentSearchTerm) return true
    const searchLower = studentSearchTerm.toLowerCase()
    return (
      student.first_name?.toLowerCase().includes(searchLower) ||
      student.last_name?.toLowerCase().includes(searchLower) ||
      student.student_id?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchLower)
    )
  })

  // Get selected student name for display
  const selectedStudent = students.find(s => s.id === parseInt(allocationData.student_id))

  const handleEdit = (room) => {
    setEditingRoom(room)
    setFormData({
      room_number: room.room_number,
      room_type_id: room.room_type_id || '',
      floor: room.floor || '',
      capacity: room.capacity,
      status: room.status,
      amenities: room.amenities || []
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      room_number: '',
      room_type_id: '',
      floor: '',
      capacity: '',
      status: 'available',
      amenities: []
    })
    setEditingRoom(null)
  }

  const filteredRooms = rooms.filter(room =>
    `${room.room_number} ${room.type_name || ''} ${room.status}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  const availableRooms = rooms.filter(r => {
    const occupancy = r.current_occupancy_count || 0;
    const capacity = r.capacity || 0;
    return occupancy < capacity && r.status !== 'maintenance' && r.status !== 'occupied';
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Room Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage rooms, allocation, and availability</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAllocationModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Users size={20} />
            Allocate Room
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Add Room
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Rooms</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{rooms.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Available Rooms</p>
          <p className="text-2xl font-bold text-green-600">{availableRooms.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Occupied Rooms</p>
          <p className="text-2xl font-bold text-blue-600">
            {rooms.filter(r => (r.current_occupancy_count || 0) > 0).length}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
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
                  <th className="table-header-cell">Room Number</th>
                  <th className="table-header-cell">Type</th>
                  <th className="table-header-cell">Floor</th>
                  <th className="table-header-cell">Capacity</th>
                  <th className="table-header-cell">Occupancy</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredRooms.map((room, index) => (
                  <motion.tr
                    key={room.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="table-cell font-medium">{room.room_number}</td>
                    <td className="table-cell">{room.type_name || 'N/A'}</td>
                    <td className="table-cell">{room.floor || 'N/A'}</td>
                    <td className="table-cell">{room.capacity}</td>
                    <td className="table-cell">
                      {room.current_occupancy_count || 0} / {room.capacity}
                    </td>
                    <td className="table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        room.status === 'available' 
                          ? 'bg-green-100 text-green-800' 
                          : room.status === 'occupied'
                          ? 'bg-red-100 text-red-800'
                          : room.status === 'partially_occupied'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {room.status === 'partially_occupied' ? 'Partially Occupied' : 
                         room.status === 'occupied' ? 'Occupied' :
                         room.status === 'maintenance' ? 'Maintenance' :
                         'Available'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleEdit(room)}
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {editingRoom ? 'Edit Room' : 'Add New Room'}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room Number *</label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="input-field"
                    required
                    disabled={!!editingRoom}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room Type *</label>
                  <select
                    value={formData.room_type_id}
                    onChange={(e) => {
                      const selectedType = roomTypes.find(type => type.id === parseInt(e.target.value))
                      setFormData({ 
                        ...formData, 
                        room_type_id: e.target.value,
                        // Auto-set capacity to match room type capacity when type is selected
                        capacity: selectedType ? selectedType.capacity : formData.capacity
                      })
                    }}
                    className="input-field"
                    required
                  >
                    <option value="">Select Room Type</option>
                    {roomTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.type_name} - Capacity: {type.capacity} - RS{type.price_per_month}/month
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Floor</label>
                    <input
                      type="number"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity *</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="input-field"
                      required
                      min="1"
                      max={formData.room_type_id ? roomTypes.find(type => type.id === parseInt(formData.room_type_id))?.capacity || '' : ''}
                    />
                    {formData.room_type_id && (
                      <p className="text-xs text-gray-500 mt-1">
                        Max capacity: {roomTypes.find(type => type.id === parseInt(formData.room_type_id))?.capacity || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {editingRoom ? 'Update' : 'Create'} Room
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

      <AnimatePresence>
        {showAllocationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => {
              setShowAllocationModal(false)
              setStudentSearchTerm('')
              setShowStudentDropdown(false)
              setAllocationData({ student_id: '', room_id: '' })
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-lg"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Allocate Room</h2>
                <button
                  onClick={() => {
                    setShowAllocationModal(false)
                    setStudentSearchTerm('')
                    setShowStudentDropdown(false)
                    setAllocationData({ student_id: '', room_id: '' })
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAllocate} className="space-y-4">
                <div className="relative" ref={studentDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Student *</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by name, ID, or email..."
                      value={studentSearchTerm}
                      onChange={(e) => {
                        setStudentSearchTerm(e.target.value)
                        setShowStudentDropdown(true)
                        if (!e.target.value) {
                          setAllocationData({ ...allocationData, student_id: '' })
                        }
                      }}
                      onFocus={() => setShowStudentDropdown(true)}
                      className="input-field pl-10 pr-10"
                      required={!allocationData.student_id}
                    />
                    {selectedStudent && (
                      <button
                        type="button"
                        onClick={() => {
                          setAllocationData({ ...allocationData, student_id: '' })
                          setStudentSearchTerm('')
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  
                  {showStudentDropdown && studentSearchTerm && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredStudents.length > 0 ? (
                        <>
                          {filteredStudents.slice(0, 50).map(student => (
                            <div
                              key={student.id}
                              onClick={() => {
                                setAllocationData({ ...allocationData, student_id: student.id.toString() })
                                setStudentSearchTerm(`${student.first_name} ${student.last_name} (${student.student_id})`)
                                setShowStudentDropdown(false)
                              }}
                              className="px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors"
                            >
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {student.first_name} {student.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {student.student_id} {student.email && `• ${student.email}`}
                              </div>
                            </div>
                          ))}
                          {filteredStudents.length > 50 && (
                            <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
                              Showing first 50 of {filteredStudents.length} results. Refine your search for more specific results.
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="px-4 py-3 text-gray-500 text-sm">
                          No students found matching "{studentSearchTerm}"
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedStudent && !showStudentDropdown && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <span className="font-medium text-blue-900">
                        Selected: {selectedStudent.first_name} {selectedStudent.last_name} ({selectedStudent.student_id})
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room *</label>
                  <select
                    value={allocationData.room_id}
                    onChange={(e) => setAllocationData({ ...allocationData, room_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Room</option>
                    {availableRooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.room_number} - {room.type_name} ({room.capacity - (room.current_occupancy_count || 0)} spots available)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Allocate
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAllocationModal(false)}
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

export default Rooms

