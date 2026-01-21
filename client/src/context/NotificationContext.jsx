import { createContext, useContext, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [confirmDialog, setConfirmDialog] = useState(null)

  const showNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    const notification = { id, message, type }
    
    setNotifications(prev => [...prev, notification])
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const showSuccess = (message, duration) => showNotification(message, 'success', duration)
  const showError = (message, duration) => showNotification(message, 'error', duration)
  const showWarning = (message, duration) => showNotification(message, 'warning', duration)
  const showInfo = (message, duration) => showNotification(message, 'info', duration)

  const showConfirm = (message, onConfirm, onCancel) => {
    setConfirmDialog({
      message,
      onConfirm: () => {
        setConfirmDialog(null)
        if (onConfirm) onConfirm()
      },
      onCancel: () => {
        setConfirmDialog(null)
        if (onCancel) onCancel()
      }
    })
  }

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return CheckCircle
      case 'error':
        return AlertCircle
      case 'warning':
        return AlertTriangle
      default:
        return Info
    }
  }

  const getColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      case 'warning':
        return 'bg-yellow-500'
      default:
        return 'bg-blue-500'
    }
  }

  const getBgColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  const getTextColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-800'
      case 'error':
        return 'text-red-800'
      case 'warning':
        return 'text-yellow-800'
      default:
        return 'text-blue-800'
    }
  }

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
        removeNotification
      }}
    >
      {children}
      
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        <AnimatePresence>
          {notifications.map((notification) => {
            const Icon = getIcon(notification.type)
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 300, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 300, scale: 0.8 }}
                className={`${getBgColor(notification.type)} border rounded-lg shadow-lg p-4 flex items-start gap-3`}
              >
                <div className={`${getColor(notification.type)} p-1 rounded-full`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className={`${getTextColor(notification.type)} font-medium`}>
                    {notification.message}
                  </p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className={`${getTextColor(notification.type)} hover:opacity-70 transition-opacity`}
                >
                  <X size={18} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={confirmDialog.onCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-full">
                  <AlertTriangle size={24} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">Confirm Action</h3>
                  <p className="text-gray-600 dark:text-gray-400">{confirmDialog.message}</p>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={confirmDialog.onCancel}
                  className="btn-secondary px-6"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className="btn-primary px-6 bg-red-600 hover:bg-red-700"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  )
}

