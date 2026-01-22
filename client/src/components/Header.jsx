import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { Bell, LogOut, Menu, X, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors duration-200">
      <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors touch-manipulation rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary-600 dark:text-primary-400">Hostel Management</h1>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors touch-manipulation rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            ) : (
              <Moon size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            )}
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 sm:p-2.5 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors touch-manipulation rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Notifications"
            >
              <Bell size={20} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
              <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[10px] sm:text-xs font-semibold">
                3
              </span>
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div
                    className="fixed inset-0 z-40 md:hidden"
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-sm bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 z-50"
                  >
                    <h3 className="font-semibold mb-2 text-sm sm:text-base text-gray-800 dark:text-gray-200">Notifications</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                        <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">New complaint received</p>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">2 minutes ago</p>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation min-h-[44px]"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block font-medium text-sm md:text-base text-gray-800 dark:text-gray-200">{user?.username}</span>
            </button>

            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                  >
                    <button
                      onClick={logout}
                      className="w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors touch-manipulation min-h-[44px]"
                    >
                      <LogOut size={18} />
                      <span className="text-sm sm:text-base">Logout</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

