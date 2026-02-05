import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useHostel } from '../context/HostelContext'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { isSuperAdmin, selectedHostelId } = useHostel()

  // Pages that don't require hostel selection for super admin
  const noHostelRequired = ['/hostels', '/users'].some(p => location.pathname.includes(p))
  const showSelectHostel = isSuperAdmin && !selectedHostelId && !noHostelRequired

  // Reset scroll position on route change
  useEffect(() => {
    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.scrollTop = 0
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex relative overflow-hidden">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full min-w-0 max-w-full transition-all duration-300 overflow-x-hidden lg:ml-64">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-full"
            style={{ minHeight: '100%' }}
          >
            {showSelectHostel ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-8 max-w-md text-center">
                  <h2 className="text-xl font-bold text-amber-800 dark:text-amber-200 mb-2">Select a Hostel</h2>
                  <p className="text-amber-700 dark:text-amber-300 mb-4">
                    Please select a hostel from the dropdown in the header to view data for that specific hostel.
                  </p>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    All stats and details on this page will be filtered by the selected hostel.
                  </p>
                </div>
              </div>
            ) : (
              <Outlet />
            )}
          </motion.div>
        </main>
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  )
}

export default Layout

