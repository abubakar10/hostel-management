import { useAuth } from '../context/AuthContext'
import { useHostel } from '../context/HostelContext'
import { useTheme } from '../context/ThemeContext'
import { Bell, LogOut, Menu, Sun, Moon, Building2, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { isSuperAdmin, selectedHostelId, setSelectedHostelId, hostels, selectedHostel } = useHostel()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showHostelDropdown, setShowHostelDropdown] = useState(false)

  const displayName = user?.username || 'Staff'

  return (
    <header className="bg-white/95 dark:bg-slate-800/95 backdrop-blur border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="px-3 sm:px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-semibold text-primary-700 dark:text-primary-400 truncate">
              Hostel office
            </p>
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 truncate">
              Signed in as {displayName}
            </p>
          </div>
          {isSuperAdmin && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowHostelDropdown(!showHostelDropdown)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border min-h-[40px] ${
                  selectedHostelId
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700 text-primary-800 dark:text-primary-300'
                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                }`}
              >
                <Building2 size={16} />
                <span className="text-sm font-medium truncate max-w-[140px]">
                  {selectedHostel ? selectedHostel.name : 'Choose a hostel'}
                </span>
                <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {showHostelDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowHostelDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute left-0 mt-1 w-56 max-h-64 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 py-1 z-50"
                    >
                      {hostels.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500">No hostels yet. Add one under Hostels.</div>
                      ) : (
                        hostels.map((hostel) => (
                          <button
                            key={hostel.id}
                            onClick={() => {
                              setSelectedHostelId(String(hostel.id))
                              setShowHostelDropdown(false)
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${
                              selectedHostelId === String(hostel.id)
                                ? 'text-primary-700 font-medium'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {hostel.name}
                          </button>
                        ))
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={theme === 'dark' ? 'Switch to light colours' : 'Switch to dark colours'}
            title={theme === 'dark' ? 'Light colours' : 'Dark colours'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <Link
            to="/notifications"
            className="p-2.5 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Alerts"
          >
            <Bell size={20} />
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 min-h-[44px]"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:block font-medium text-sm text-slate-800 dark:text-slate-200">{displayName}</span>
            </button>
            <AnimatePresence>
              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 py-2 z-50"
                  >
                    <button
                      onClick={logout}
                      className="w-full px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 min-h-[44px]"
                    >
                      <LogOut size={18} />
                      Sign out
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
