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
  const [formData, setFormData] = useState({
    to_room_id: '',
    reason: ''
  })

  useEffect(() => {
    fetchTransfers()
    fetchAvailableRooms()
  }, [])

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
    try {
      await api.post('/api/student/room-transfers', formData)
      showSuccess('Room transfer request submitted successfully')
      fetchTransfers()
      fetchAvailableRooms()
      setShowModal(false)
      setFormData({ to_room_id: '', reason: '' })
    } catch (error) {
      showError(error.response?.data?.error || 'Error submitting transfer request')
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
        {availableRooms.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Request Transfer
          </button>
        )}
      </div>

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
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{transfer.from_room || 'N/A'}</span>
                    <ArrowRightLeft size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{transfer.to_room || 'N/A'}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Requested: {new Date(transfer.requested_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}>
                  {transfer.status}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{transfer.reason}</p>
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To Room *</label>
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
                  <button type="submit" className="btn-primary flex-1">Submit Request</button>
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

