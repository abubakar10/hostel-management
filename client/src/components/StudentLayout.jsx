import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import api from '../config/api'
import { 
  LayoutDashboard, 
  User, 
  DollarSign, 
  ClipboardCheck, 
  AlertCircle, 
  Calendar,
  ArrowRightLeft,
  Bell,
  LogOut,
  Menu,
  X,
  Building2
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const StudentLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hostelName, setHostelName] = useState('')
  
  useEffect(() => {
    fetchHostelName()
  }, [])
  
  const fetchHostelName = async () => {
    try {
      const response = await api.get('/api/student/profile')
      setHostelName(response.data?.hostel_name || '')
    } catch (error) {
      console.error('Error fetching hostel name:', error)
    }
  }

  const menuItems = [
    { path: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/student/profile', icon: User, label: 'My Profile' },
    { path: '/student/fees', icon: DollarSign, label: 'Fees' },
    { path: '/student/attendance', icon: ClipboardCheck, label: 'Attendance' },
    { path: '/student/complaints', icon: AlertCircle, label: 'Complaints' },
    { path: '/student/leaves', icon: Calendar, label: 'Leaves' },
    { path: '/student/room-transfers', icon: ArrowRightLeft, label: 'Room Transfers' },
    { path: '/student/notifications', icon: Bell, label: 'Notifications' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors duration-200">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-primary-600 dark:text-primary-400">
                Student Portal
              </h1>
              {hostelName && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Building2 size={12} />
                  {hostelName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.first_name?.charAt(0) || user?.student_id?.charAt(0) || 'S'}
              </div>
              <span className="hidden sm:block font-medium text-sm md:text-base text-gray-800 dark:text-gray-200">
                {user?.first_name} {user?.last_name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
              aria-label="Logout"
            >
              <LogOut size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Sidebar */}
        <aside className={`
          fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]
          w-64 bg-white dark:bg-gray-800 shadow-lg z-50
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          overflow-y-auto
        `}>
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 md:hidden">
            <h2 className="font-semibold text-gray-800 dark:text-gray-200">Menu</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>
          <nav className="p-2 sm:p-4 space-y-1 sm:space-y-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NavLink
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        setSidebarOpen(false)
                      }
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 touch-manipulation min-h-[44px] ${
                        isActive
                          ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-md'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`
                    }
                  >
                    <Icon size={18} className="sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="font-medium text-sm sm:text-base">{item.label}</span>
                  </NavLink>
                </motion.div>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default StudentLayout

