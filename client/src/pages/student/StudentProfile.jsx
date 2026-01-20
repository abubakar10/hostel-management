import { useState, useEffect } from 'react'
import api from '../../config/api'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'
import { User, Mail, Phone, MapPin, Calendar, Book, Home, Building2 } from 'lucide-react'
import { useNotification } from '../../context/NotificationContext'

const StudentProfile = () => {
  const { user } = useAuth()
  const { showError } = useNotification()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/student/profile')
      setProfile(response.data)
    } catch (error) {
      showError('Error loading profile')
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Profile not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2">My Profile</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">View your personal information</p>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold">
            {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">Student ID: {profile.student_id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex items-start gap-3">
            <Mail className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-gray-800 dark:text-gray-200">{profile.email || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-gray-800 dark:text-gray-200">{profile.phone || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
              <p className="text-gray-800 dark:text-gray-200">
                {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Gender</p>
              <p className="text-gray-800 dark:text-gray-200 capitalize">{profile.gender || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Book className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Course</p>
              <p className="text-gray-800 dark:text-gray-200">{profile.course || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Year of Study</p>
              <p className="text-gray-800 dark:text-gray-200">{profile.year_of_study || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Building2 className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Hostel</p>
              <p className="text-gray-800 dark:text-gray-200">
                {profile.hostel_name || 'Not Assigned'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Home className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Room</p>
              <p className="text-gray-800 dark:text-gray-200">
                {profile.room_number ? `${profile.room_number} (${profile.room_type || 'N/A'})` : 'Not Assigned'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" size={20} />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                profile.status === 'active'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
              }`}>
                {profile.status || 'active'}
              </span>
            </div>
          </div>

          {profile.address && (
            <div className="flex items-start gap-3 md:col-span-2">
              <MapPin className="text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                <p className="text-gray-800 dark:text-gray-200">{profile.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentProfile

