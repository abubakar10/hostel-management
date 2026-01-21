import { createContext, useContext, useState, useEffect } from 'react'
import api from '../config/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)
  }, [])

  const login = async (username, password, userType = null) => {
    try {
      // If userType is not specified, try admin first, then student
      if (!userType) {
        // Try admin/staff login first
        try {
          const response = await api.post('/api/auth/login', { username, password, userType: 'admin' })
          const { token, user } = response.data
          
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))
          setUser(user)
          
          return { success: true, user }
        } catch (adminError) {
          // If admin login fails, try student login
          try {
            const response = await api.post('/api/auth/login', { username, password, userType: 'student' })
            const { token, user } = response.data
            
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            setUser(user)
            
            return { success: true, user }
          } catch (studentError) {
            // Both failed, return the most specific error
            const errorMessage = studentError.response?.data?.error || adminError.response?.data?.error || 'Invalid credentials'
            return {
              success: false,
              error: errorMessage
            }
          }
        }
      } else {
        // UserType specified, use it directly
        const response = await api.post('/api/auth/login', { username, password, userType })
        const { token, user } = response.data
        
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setUser(user)
        
        return { success: true, user }
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

