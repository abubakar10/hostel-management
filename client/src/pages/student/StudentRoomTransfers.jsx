import { useState, useEffect } from 'react'
import api from '../../config/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowRightLeft, Clock, CheckCircle, XCircle, X } from 'lucide-react'
import { useNotification } from '../../context/NotificationContext'

const StudentRoomTransfers = () => {
  const { showError, showSuccess } = useNotification()
  const [transfers, setTransfers] = useState([])
  const [availableRooms, setAvailableRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [studentInfo, setStudentInfo] = useState(null)
  const [formData, setFormData] = useState({
    to_room_id: '',
    reason: ''
  })

  useEffect(() => {
    fetchTransfers()
    fetchAvailableRooms()
    fetchStudentInfo()
    
    // Refresh data every 30 seconds to get updated status
    const interval = setInterval(() => {
      fetchTransfers()
      fetchStudentInfo()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchStudentInfo = async () => {
    try {
      const response = await api.get('/api/student/profile')
      setStudentInfo(response.data)
    } catch (error) {
      console.error('Error fetching student info:', error)
    }
  }

  const fetchTransfers = async () => {
    try {
      const response = await api.get('/api/student/room-transfers')
      setTransfers(response.data)
    } catch (error) {
      showError('Error loading transfer requests')
      console.error('Error fetching transfers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableRooms = async () => {
    try {
      const response = await api.get('/api/student/rooms/available')
      setAvailableRooms(response.data)
    } catch (error) {
      console.error('Error fetching available rooms:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate student has a room
    if (!studentInfo?.room_id) {
      showError('You must be assigned to a room before requesting a transfer. Please contact the hostel administration.')
      return
    }
    
    // Validate available rooms
    if (availableRooms.length === 0) {
      showError('No available rooms for transfer at this time.')
      return
    }
    
    try {
      await api.post('/api/student/room-transfers', formData)
      showSuccess('Room transfer request submitted successfully')
      fetchTransfers()
      fetchAvailableRooms()
      fetchStudentInfo() // Refresh student info
      setShowModal(false)
      setFormData({ to_room_id: '', reason: '' })
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Error submitting transfer request'
      showError(errorMessage)
      
      // If error is about room assignment, refresh student info
      if (errorMessage.includes('not currently assigned to a room') || errorMessage.includes('not assigned to a hostel')) {
        fetchStudentInfo()
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2">Room Transfers</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Request room transfers and track status</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
          disabled={!studentInfo?.room_id || availableRooms.length === 0}
          title={!studentInfo?.room_id ? 'You must be assigned to a room first' : availableRooms.length === 0 ? 'No available rooms for transfer' : 'Request room transfer'}
        >
          <Plus size={20} />
          Request Transfer
        </button>
      </div>

      {/* Info Messages */}
      {!studentInfo?.room_id && (
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-800 dark:text-yellow-300">
            <strong>Note:</strong> You must be assigned to a room before you can request a transfer. Please contact the hostel administration.
          </p>
        </div>
      )}
      {studentInfo?.room_id && availableRooms.length === 0 && (
        <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <p className="text-blue-800 dark:text-blue-300">
            <strong>Info:</strong> There are currently no available rooms for transfer. Check back later or contact the hostel administration.
          </p>
        </div>
      )}

      <div className="card">
        <div className="space-y-4">
          {transfers.map((transfer, index) => (
            <motion.div
              key={transfer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{transfer.from_room || 'N/A'}</span>
                    <ArrowRightLeft size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{transfer.to_room || 'N/A'}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Requested: {transfer.requested_at ? new Date(transfer.requested_at).toLocaleDateString() : 'N/A'}
                    {transfer.approved_at && (
                      <span className="ml-2">
                        • Approved: {new Date(transfer.approved_at).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                  {transfer.approved_by_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Approved by: {transfer.approved_by_name}
                    </p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                  {transfer.status}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{transfer.reason}</p>
              {transfer.status === 'approved' && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-800 dark:text-green-300 font-medium text-sm">
                    ✓ Transfer completed! You have been moved to room {transfer.to_room || 'N/A'}
                  </p>
                  {transfer.transfer_date && (
                    <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                      Transfer date: {new Date(transfer.transfer_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
              {transfer.status === 'rejected' && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-300 font-medium text-sm">
                    ✗ Transfer request was rejected
                  </p>
                </div>
              )}
            </motion.div>
          ))}
          {transfers.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No transfer requests submitted yet
            </div>
          )}
        </div>
      </div>

      {/* Request Transfer Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto modal-content"
            >
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-gray-100">Request Room Transfer</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {studentInfo?.room_id && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Current Room:</strong> {studentInfo.room_number || 'N/A'}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Room *</label>
                  {availableRooms.length > 0 ? (
                    <select
                      value={formData.to_room_id}
                      onChange={(e) => setFormData({ ...formData, to_room_id: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Select Room</option>
                      {availableRooms.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.room_number} - {room.type_name || 'N/A'} ({room.available_spots} available)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No available rooms for transfer at this time.
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason *</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="input-field"
                    rows="3"
                    required
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button 
                    type="submit" 
                    className="btn-primary flex-1"
                    disabled={!studentInfo?.room_id || availableRooms.length === 0}
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
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

export default StudentRoomTransfers

