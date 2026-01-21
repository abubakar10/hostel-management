import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const StudentPrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user || user.role !== 'student') {
    return <Navigate to="/login" replace />
  }

  return children
}

export default StudentPrivateRoute

