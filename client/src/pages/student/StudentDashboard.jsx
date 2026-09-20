import { useState, useEffect } from 'react'
import api from '../../config/api'
import { useAuth } from '../../context/AuthContext'
import {
  User,
  DollarSign,
  AlertCircle,
  Calendar,
  TrendingUp,
  ArrowRightLeft,
  Building2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'

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

      const presentCount = attendance.filter((a) => a.status === 'present').length
      const absentCount = attendance.filter((a) => a.status === 'absent').length
      const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0

      setStats({
        fees: {
          total: fees.reduce((sum, f) => sum + parseFloat(f.amount || 0), 0),
          paid: fees.filter((f) => f.status === 'paid').reduce((sum, f) => sum + parseFloat(f.amount || 0), 0),
          pending: fees.filter((f) => f.status === 'pending' || f.status === 'overdue').reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)
        },
        attendance: { present: presentCount, absent: absentCount, rate: attendanceRate },
        complaints: complaints.filter((c) => c.status === 'open' || c.status === 'in_progress').length,
        leaves: leaves.filter((l) => l.status === 'pending').length
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
    { label: 'Still to pay', value: `RS ${stats.fees.pending.toLocaleString()}`, hint: 'Pay at the hostel office', icon: DollarSign, color: 'bg-amber-600', link: '/student/fees' },
    { label: 'Days you were present', value: `${stats.attendance.rate}%`, hint: 'Your attendance so far', icon: TrendingUp, color: 'bg-emerald-600', link: '/student/attendance' },
    { label: 'Open problems', value: stats.complaints, hint: 'Things you reported', icon: AlertCircle, color: 'bg-red-600', link: '/student/complaints' },
    { label: 'Leave waiting', value: stats.leaves, hint: 'Waiting for a yes or no', icon: Calendar, color: 'bg-primary-600', link: '/student/leaves' }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${user?.first_name || 'there'}`}
        subtitle={
          profile?.hostel_name
            ? `You live at ${profile.hostel_name}. Check payments, ask for leave, or report a problem from here.`
            : 'Check payments, ask for leave, or report a problem from here.'
        }
      />

      {profile?.hostel_name && (
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Building2 size={16} className="text-primary-700" />
          {profile.hostel_name}
          {profile.room_number ? ` · Room ${profile.room_number}` : ''}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <button
              key={stat.label}
              onClick={() => navigate(stat.link)}
              className="card text-left"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-slate-500 text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.hint}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-2xl`}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">What do you need?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={() => navigate('/student/complaints')} className="btn-secondary text-left p-4 flex items-center gap-3">
            <AlertCircle size={20} />
            Report a problem
          </button>
          <button onClick={() => navigate('/student/leaves')} className="btn-secondary text-left p-4 flex items-center gap-3">
            <Calendar size={20} />
            Ask for leave
          </button>
          <button onClick={() => navigate('/student/room-transfers')} className="btn-secondary text-left p-4 flex items-center gap-3">
            <ArrowRightLeft size={20} />
            Ask to change room
          </button>
          <button onClick={() => navigate('/student/profile')} className="btn-secondary text-left p-4 flex items-center gap-3">
            <User size={20} />
            See my details
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
