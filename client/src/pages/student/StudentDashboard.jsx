import { useState, useEffect } from 'react'
import api from '../../config/api'
import { useAuth } from '../../context/AuthContext'
import { motion } from 'framer-motion'
import { 
  User, 
  DollarSign, 
  ClipboardCheck, 
  AlertCircle, 
  Calendar,
  TrendingUp,
  Clock,
  ArrowRightLeft,
  Building2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const StudentDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    fees: { total: 0, pending: 0, paid: 0 },
    attendance: { present: 0, absent: 0, rate: 0 },
    complaints: 0,
    leaves: 0
  })
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [feesRes, attendanceRes, complaintsRes, leavesRes, profileRes] = await Promise.all([
        api.get('/api/student/fees'),
        api.get('/api/student/attendance'),
        api.get('/api/student/complaints'),
        api.get('/api/student/leaves'),
        api.get('/api/student/profile')
      ])
      
      setProfile(profileRes.data)

      const fees = feesRes.data
      const attendance = attendanceRes.data
      const complaints = complaintsRes.data
      const leaves = leavesRes.data

      // Calculate fee stats
      const totalFees = fees.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)
      const paidFees = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)
      const pendingFees = fees.filter(f => f.status === 'pending' || f.status === 'overdue').reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)

      // Calculate attendance stats
      const presentCount = attendance.filter(a => a.status === 'present').length
      const absentCount = attendance.filter(a => a.status === 'absent').length
      const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0

      setStats({
        fees: { total: totalFees, pending: pendingFees, paid: paidFees },
        attendance: { present: presentCount, absent: absentCount, rate: attendanceRate },
        complaints: complaints.filter(c => c.status === 'open' || c.status === 'in_progress').length,
        leaves: leaves.filter(l => l.status === 'pending').length
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
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

  const statCards = [
    {
      label: 'Pending Fees',
      value: `RS ${stats.fees.pending.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      link: '/student/fees'
    },
    {
      label: 'Attendance Rate',
      value: `${stats.attendance.rate}%`,
      icon: TrendingUp,
      color: 'bg-green-500',
      link: '/student/attendance'
    },
    {
      label: 'Active Complaints',
      value: stats.complaints,
      icon: AlertCircle,
      color: 'bg-red-500',
      link: '/student/complaints'
    },
    {
      label: 'Pending Leaves',
      value: stats.leaves,
      icon: Calendar,
      color: 'bg-blue-500',
      link: '/student/leaves'
    }
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-1 sm:mb-2">
          Welcome back, {user?.first_name}!
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Here's your dashboard overview
          </p>
          {profile?.hostel_name && (
            <div className="flex items-center gap-2 text-sm sm:text-base">
              <Building2 size={16} className="text-primary-600 dark:text-primary-400" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {profile.hostel_name}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card hover:scale-105 transition-transform duration-200 cursor-pointer"
              onClick={() => navigate(stat.link)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 sm:p-4 rounded-full`}>
                  <Icon size={20} className="sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => navigate('/student/complaints')}
            className="btn-secondary text-left p-4 flex items-center gap-3"
          >
            <AlertCircle size={20} />
            <span>Submit Complaint</span>
          </button>
          <button
            onClick={() => navigate('/student/leaves')}
            className="btn-secondary text-left p-4 flex items-center gap-3"
          >
            <Calendar size={20} />
            <span>Apply for Leave</span>
          </button>
          <button
            onClick={() => navigate('/student/room-transfers')}
            className="btn-secondary text-left p-4 flex items-center gap-3"
          >
            <ArrowRightLeft size={20} />
            <span>Request Room Transfer</span>
          </button>
          <button
            onClick={() => navigate('/student/profile')}
            className="btn-secondary text-left p-4 flex items-center gap-3"
          >
            <User size={20} />
            <span>View Profile</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard

