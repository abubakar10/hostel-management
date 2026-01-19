import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Home,
  DollarSign,
  ClipboardCheck,
  AlertCircle,
  UserCog,
  BarChart3,
  Bell,
  Building2,
  UserPlus
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/students', icon: Users, label: 'Students' },
  { path: '/rooms', icon: Home, label: 'Rooms' },
  { path: '/fees', icon: DollarSign, label: 'Fees' },
  { path: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
  { path: '/complaints', icon: AlertCircle, label: 'Complaints' },
  { path: '/staff', icon: UserCog, label: 'Staff' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
]

const Sidebar = () => {
  const { user } = useAuth()
  
  // Add super admin menu items
  const allMenuItems = user?.role === 'super_admin' 
    ? [...menuItems, 
        { path: '/hostels', icon: Building2, label: 'Hostels' },
        { path: '/users', icon: UserPlus, label: 'Users' }
      ]
    : menuItems

  return (
    <aside className="w-64 bg-white shadow-lg min-h-screen sticky top-16">
      <nav className="p-4 space-y-2">
        {allMenuItems.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </motion.div>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
