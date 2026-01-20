import { useState, useEffect } from 'react'
import api from '../../config/api'
import { motion } from 'framer-motion'
import { Bell, Info, AlertCircle, CheckCircle } from 'lucide-react'
import { useNotification } from '../../context/NotificationContext'

const StudentNotifications = () => {
  const { showError } = useNotification()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/student/notifications')
      setNotifications(response.data)
    } catch (error) {
      showError('Error loading notifications')
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="text-red-500" size={20} />
      case 'reminder':
        return <Bell className="text-yellow-500" size={20} />
      case 'info':
        return <Info className="text-blue-500" size={20} />
      default:
        return <Info className="text-gray-500" size={20} />
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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2">Notifications</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">View your notifications</p>
      </div>

      <div className="card">
        <div className="space-y-4">
          {notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`border rounded-lg p-4 sm:p-6 ${
                notification.is_read
                  ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  : 'border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20'
              }`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">
                    {notification.title}
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-2"></div>
                )}
              </div>
            </motion.div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No notifications
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentNotifications

