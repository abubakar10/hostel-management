import { useState, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Search, X, Users } from 'lucide-react'

const Rooms = () => {
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

  useEffect(() => {
    fetchRooms()
    fetchRoomTypes()
    fetchStudents()
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms')
      setRooms(response.data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoomTypes = async () => {
    try {
      const response = await axios.get('/api/rooms/types/all')
      setRoomTypes(response.data)
    } catch (error) {
      console.error('Error fetching room types:', error)
    }
  }

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students')
      setStudents(response.data.filter(s => s.status === 'active'))
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingRoom) {
        await axios.put(`/api/rooms/${editingRoom.id}`, formData)
      } else {
        await axios.post('/api/rooms', formData)
      }
      fetchRooms()
      setShowModal(false)
      resetForm()
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving room')
    }
  }

  const handleAllocate = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/rooms/allocate', allocationData)
      fetchRooms()
      fetchStudents()
      setShowAllocationModal(false)
      setAllocationData({ student_id: '', room_id: '' })
      alert('Room allocated successfully!')
    } catch (error) {
      alert(error.response?.data?.error || 'Error allocating room')
    }
  }

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

  const availableRooms = rooms.filter(r => 
    (r.current_occupancy_count || 0) < r.capacity && r.status === 'available'
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Room Management</h1>
          <p className="text-gray-600">Manage rooms, allocation, and availability</p>
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
          <p className="text-gray-600 text-sm mb-1">Total Rooms</p>
          <p className="text-2xl font-bold text-gray-800">{rooms.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm mb-1">Available Rooms</p>
          <p className="text-2xl font-bold text-green-600">{availableRooms.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm mb-1">Occupied Rooms</p>
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
                        room.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      <button
                        onClick={() => handleEdit(room)}
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
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  {editingRoom ? 'Edit Room' : 'Add New Room'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type *</label>
                  <select
                    value={formData.room_type_id}
                    onChange={(e) => setFormData({ ...formData, room_type_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select Room Type</option>
                    {roomTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.type_name} - Capacity: {type.capacity} - ₹{type.price_per_month}/month
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                    <input
                      type="number"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="input-field"
                      required
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
            onClick={() => setShowAllocationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Allocate Room</h2>
                <button
                  onClick={() => setShowAllocationModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAllocate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                  <select
                    value={allocationData.student_id}
                    onChange={(e) => setAllocationData({ ...allocationData, student_id: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room *</label>
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

