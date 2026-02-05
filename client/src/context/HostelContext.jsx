import { createContext, useContext, useState, useEffect } from 'react'
import api from '../config/api'
import { useAuth } from './AuthContext'

const STORAGE_KEY = 'selectedHostelId'

const HostelContext = createContext()

export const useHostel = () => {
  const context = useContext(HostelContext)
  if (!context) {
    throw new Error('useHostel must be used within HostelProvider')
  }
  return context
}

export const HostelProvider = ({ children }) => {
  const { user } = useAuth()
  // Initialize from localStorage so selection persists across reloads
  const [selectedHostelId, setSelectedHostelIdState] = useState(() => localStorage.getItem(STORAGE_KEY) || null)
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(false)

  const isSuperAdmin = user?.role === 'super_admin'

  // Sync from localStorage when super admin (in case of tab/context refresh)
  useEffect(() => {
    if (isSuperAdmin) {
      const saved = localStorage.getItem(STORAGE_KEY)
      setSelectedHostelIdState(saved || null)
    } else if (user) {
      // User is logged in but not super admin - clear selection for this session
      setSelectedHostelIdState(null)
    }
    // Don't clear when user is null - that happens on reload before auth restores
  }, [isSuperAdmin, user])

  // Fetch hostels list for super admin
  useEffect(() => {
    if (isSuperAdmin) {
      setLoading(true)
      api.get('/api/hostels')
        .then(res => setHostels(res.data.filter(h => h.status === 'active')))
        .catch(() => setHostels([]))
        .finally(() => setLoading(false))
    } else {
      setHostels([])
    }
  }, [isSuperAdmin])

  const setSelectedHostelId = (id) => {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id)
      setSelectedHostelIdState(id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
      setSelectedHostelIdState(null)
    }
    // Dispatch storage event so api interceptor can pick up the change
    window.dispatchEvent(new Event('hostel-selection-changed'))
  }

  const value = {
    selectedHostelId,
    setSelectedHostelId,
    hostels,
    loading,
    isSuperAdmin,
    selectedHostel: hostels.find(h => h.id === parseInt(selectedHostelId)) || hostels.find(h => String(h.id) === selectedHostelId)
  }

  return (
    <HostelContext.Provider value={value}>
      {children}
    </HostelContext.Provider>
  )
}
