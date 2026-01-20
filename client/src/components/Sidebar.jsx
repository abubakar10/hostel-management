import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Home,
  DollarSign,
  ClipboardCheck,
  AlertCircle,
  Wrench,
  UserCog,
  BarChart3,
  Bell,
  Building2,
  UserPlus,
  UserCheck,
  Calendar,
  Utensils,
  Package,
  FileText,
  ArrowRightLeft,
  X
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/students', icon: Users, label: 'Students' },
  { path: '/rooms', icon: Home, label: 'Rooms' },
  { path: '/fees', icon: DollarSign, label: 'Fees' },
  { path: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { path: '/visitors', icon: UserCheck, label: 'Visitors' },
  { path: '/leaves', icon: Calendar, label: 'Leaves' },
  { path: '/mess', icon: Utensils, label: 'Mess' },
  { path: '/complaints', icon: AlertCircle, label: 'Complaints' },
  { path: '/maintenance', icon: Wrench, label: 'Maintenance' },
  { path: '/room-transfers', icon: ArrowRightLeft, label: 'Room Transfers' },
  { path: '/inventory', icon: Package, label: 'Inventory' },
  { path: '/documents', icon: FileText, label: 'Documents' },
  { path: '/staff', icon: UserCog, label: 'Staff' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
]

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  
  // Add super admin menu items
  const allMenuItems = user?.role === 'super_admin' 
    ? [...menuItems, 
        { path: '/hostels', icon: Building2, label: 'Hostels' },
        { path: '/users', icon: UserPlus, label: 'Users' }
      ]
    : menuItems

  return (
    <>
      <aside className={`
        fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)]
        w-64 bg-white dark:bg-gray-800 shadow-lg z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        overflow-y-auto
      `}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 md:hidden">
          <h2 className="font-semibold text-gray-800 dark:text-gray-200">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="p-2 sm:p-4 space-y-1 sm:space-y-2">
          {allMenuItems.map((item, index) => {
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
                    // Close sidebar on mobile when item is clicked
                    if (window.innerWidth < 768) {
                      onClose()
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
    </>
  )
}

export default Sidebar
