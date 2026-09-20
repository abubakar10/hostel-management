import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
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
  Building2,
  Sun,
  Moon
} from 'lucide-react'

const StudentLayout = () => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hostelName, setHostelName] = useState('')

  useEffect(() => {
    api.get('/api/student/profile')
      .then((response) => setHostelName(response.data?.hostel_name || ''))
      .catch(() => {})
  }, [])

  const menuItems = [
    { path: '/student/dashboard', icon: LayoutDashboard, label: 'Home' },
    { path: '/student/profile', icon: User, label: 'My details' },
    { path: '/student/fees', icon: DollarSign, label: 'My payments' },
    { path: '/student/attendance', icon: ClipboardCheck, label: 'My attendance' },
    { path: '/student/complaints', icon: AlertCircle, label: 'Problems' },
    { path: '/student/leaves', icon: Calendar, label: 'Leave' },
    { path: '/student/room-transfers', icon: ArrowRightLeft, label: 'Change room' },
    { path: '/student/notifications', icon: Bell, label: 'Alerts' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="px-3 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 rounded-xl"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-primary-700 dark:text-primary-400">
                Resident home
              </h1>
              {hostelName && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Building2 size={12} />
                  {hostelName}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[44px] min-w-[44px]"
              aria-label="Change colours"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.first_name?.charAt(0) || user?.student_id?.charAt(0) || 'R'}
              </div>
              <span className="hidden sm:block font-medium text-sm text-slate-800 dark:text-slate-200">
                {user?.first_name} {user?.last_name}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-600 hover:text-red-600 rounded-xl"
              aria-label="Sign out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex relative">
        <aside className={`
          fixed md:sticky top-16 left-0 h-[calc(100vh-4rem)]
          w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50
          transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          overflow-y-auto
        `}>
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 md:hidden">
            <h2 className="font-semibold">Menu</h2>
            <button onClick={() => setSidebarOpen(false)} className="p-2" aria-label="Close menu">
              <X size={24} />
            </button>
          </div>
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 768) setSidebarOpen(false)
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl min-h-[44px] ${
                      isActive
                        ? 'bg-primary-600 text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`
                  }
                >
                  <Icon size={18} />
                  <span className="font-medium text-[15px]">{item.label}</span>
                </NavLink>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          <Outlet />
        </main>

        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default StudentLayout
