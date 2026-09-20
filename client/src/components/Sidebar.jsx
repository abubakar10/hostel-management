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
import { useAuth } from '../context/AuthContext'

const menuGroups = [
  {
    title: 'Start here',
    items: [{ path: '/dashboard', icon: LayoutDashboard, label: 'Home' }]
  },
  {
    title: 'People and rooms',
    items: [
      { path: '/students', icon: Users, label: 'People' },
      { path: '/rooms', icon: Home, label: 'Rooms' },
      { path: '/staff', icon: UserCog, label: 'Staff' }
    ]
  },
  {
    title: 'Daily work',
    items: [
      { path: '/fees', icon: DollarSign, label: 'Payments' },
      { path: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
      { path: '/visitors', icon: UserCheck, label: 'Visitors' },
      { path: '/mess', icon: Utensils, label: 'Meals' }
    ]
  },
  {
    title: 'Requests',
    items: [
      { path: '/leaves', icon: Calendar, label: 'Leave' },
      { path: '/complaints', icon: AlertCircle, label: 'Problems' },
      { path: '/maintenance', icon: Wrench, label: 'Repairs' },
      { path: '/room-transfers', icon: ArrowRightLeft, label: 'Room change' }
    ]
  },
  {
    title: 'Records',
    items: [
      { path: '/inventory', icon: Package, label: 'Stock' },
      { path: '/documents', icon: FileText, label: 'Files' },
      { path: '/reports', icon: BarChart3, label: 'Money report' },
      { path: '/notifications', icon: Bell, label: 'Alerts' }
    ]
  }
]

const NavItem = ({ item, onClose }) => {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      onClick={() => {
        if (window.innerWidth < 768) onClose?.()
      }}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors touch-manipulation min-h-[44px] ${
          isActive
            ? 'bg-primary-600 text-white'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`
      }
    >
      <Icon size={18} className="flex-shrink-0" />
      <span className="font-medium text-[15px]">{item.label}</span>
    </NavLink>
  )
}

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const groups = user?.role === 'super_admin'
    ? [
        ...menuGroups,
        {
          title: 'Owner',
          items: [
            { path: '/hostels', icon: Building2, label: 'Hostels' },
            { path: '/users', icon: UserPlus, label: 'Managers' }
          ]
        }
      ]
    : menuGroups

  const nav = (
    <nav className="p-3 space-y-5">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {group.title}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavItem key={item.path} item={item} onClose={onClose} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )

  return (
    <>
      <aside className={`
        fixed md:hidden top-16 left-0 h-[calc(100vh-4rem)]
        w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        overflow-y-auto
      `}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        {nav}
      </aside>

      <aside className="hidden md:block fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto z-30">
        {nav}
      </aside>
    </>
  )
}

export default Sidebar
