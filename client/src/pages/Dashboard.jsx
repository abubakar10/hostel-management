import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../config/api'
import { motion } from 'framer-motion'
import {
  Users,
  Home,
  DollarSign,
  ClipboardCheck,
  TrendingUp,
  AlertCircle,
  Plus,
  Wrench,
  Calendar,
  Clock,
  ArrowRight,
  Activity,
  Percent
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    students: 0,
    rooms: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    occupancyRate: 0,
    totalFees: 0,
    pendingFees: 0,
    overdueFees: 0,
    complaints: 0,
    maintenance: 0,
    attendance: 0,
    attendanceRate: 0
  })
  const [pendingFeesBreakdown, setPendingFeesBreakdown] = useState([])
  const [recentActivities, setRecentActivities] = useState([])
  const [monthlyTrends, setMonthlyTrends] = useState([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 300000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [students, rooms, fees, complaints, maintenance, attendance] = await Promise.all([
        api.get('/api/students'),
        api.get('/api/rooms'),
        api.get('/api/fees'),
        api.get('/api/complaints'),
        api.get('/api/complaints/maintenance/all'),
        api.get('/api/attendance')
      ])

      // Calculate occupancy
      const totalRooms = rooms.data.length
      const occupiedRooms = rooms.data.filter(r => (r.current_occupancy_count || 0) > 0).length
      const totalCapacity = rooms.data.reduce((sum, r) => sum + (parseInt(r.capacity) || 0), 0)
      const occupiedCapacity = rooms.data.reduce((sum, r) => sum + (parseInt(r.current_occupancy_count) || 0), 0)
      const occupancyRate = totalCapacity > 0 ? Math.round((occupiedCapacity / totalCapacity) * 100) : 0

      // Calculate fees
      const totalFees = fees.data
        .filter(f => f.status === 'paid')
        .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)
      
      const pendingFees = fees.data
        .filter(f => f.status === 'pending')
        .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)

      const overdueFees = fees.data
        .filter(f => {
          if (f.status !== 'pending') return false
          const dueDate = new Date(f.due_date)
          return dueDate < new Date()
        })
        .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)

      // Pending fees breakdown by student
      const feesByStudent = {}
      fees.data
        .filter(f => f.status === 'pending')
        .forEach(f => {
          const studentName = `${f.first_name} ${f.last_name}`
          if (!feesByStudent[studentName]) {
            feesByStudent[studentName] = { name: studentName, amount: 0, count: 0 }
          }
          feesByStudent[studentName].amount += parseFloat(f.amount || 0)
          feesByStudent[studentName].count += 1
        })
      setPendingFeesBreakdown(Object.values(feesByStudent).slice(0, 5))

      // Calculate attendance rate
      const today = new Date().toISOString().split('T')[0]
      const todayAttendance = attendance.data.filter(a => a.date === today)
      const presentCount = todayAttendance.filter(a => a.status === 'present').length
      const attendanceRate = todayAttendance.length > 0 
        ? Math.round((presentCount / todayAttendance.length) * 100) 
        : 0

      // Recent activities
      const activities = []
      
      // Recent students
      students.data.slice(0, 3).forEach(s => {
        activities.push({
          type: 'student',
          message: `New student added: ${s.first_name} ${s.last_name}`,
          time: new Date(s.created_at),
          icon: Users
        })
      })

      // Recent complaints
      complaints.data.filter(c => c.status === 'open').slice(0, 3).forEach(c => {
        activities.push({
          type: 'complaint',
          message: `New complaint: ${c.title}`,
          time: new Date(c.created_at),
          icon: AlertCircle
        })
      })

      // Recent maintenance
      maintenance.data.filter(m => m.status === 'pending').slice(0, 2).forEach(m => {
        activities.push({
          type: 'maintenance',
          message: `Maintenance request: ${m.title}`,
          time: new Date(m.created_at),
          icon: Wrench
        })
      })

      activities.sort((a, b) => b.time - a.time)
      setRecentActivities(activities.slice(0, 5))

      // Monthly trends (last 6 months)
      const trends = []
      const now = new Date()
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthFees = fees.data.filter(f => {
          if (f.status !== 'paid' || !f.paid_date) return false
          const paidDate = new Date(f.paid_date)
          return paidDate >= monthStart && paidDate <= monthEnd
        }).reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)

        const monthStudents = students.data.filter(s => {
          const createdDate = new Date(s.created_at)
          return createdDate >= monthStart && createdDate <= monthEnd
        }).length

        trends.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          fees: monthFees,
          students: monthStudents
        })
      }
      setMonthlyTrends(trends)

      // Upcoming deadlines (fees due in next 7 days)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const upcoming = fees.data
        .filter(f => {
          if (f.status !== 'pending') return false
          const dueDate = new Date(f.due_date)
          return dueDate >= new Date() && dueDate <= nextWeek
        })
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5)
        .map(f => ({
          type: 'fee',
          title: `Fee due: ${f.first_name} ${f.last_name}`,
          amount: parseFloat(f.amount || 0),
          date: new Date(f.due_date),
          studentId: f.student_id
        }))
      setUpcomingDeadlines(upcoming)

      setStats({
        students: students.data.length,
        rooms: rooms.data.length,
        totalRooms,
        occupiedRooms,
        occupancyRate,
        totalFees,
        pendingFees,
        overdueFees,
        complaints: complaints.data.filter(c => c.status === 'open').length,
        maintenance: maintenance.data.filter(m => m.status === 'pending').length,
        attendance: todayAttendance.length,
        attendanceRate
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { icon: Users, label: 'Total Students', value: stats.students, color: 'bg-blue-500', link: '/students' },
    { icon: Home, label: 'Total Rooms', value: `${stats.occupiedRooms}/${stats.totalRooms}`, color: 'bg-green-500', link: '/rooms' },
    { icon: Percent, label: 'Occupancy Rate', value: `${stats.occupancyRate}%`, color: 'bg-indigo-500', link: '/rooms' },
    { icon: DollarSign, label: 'Total Revenue', value: `RS ${stats.totalFees.toLocaleString()}`, color: 'bg-yellow-500', link: '/fees' },
    { icon: AlertCircle, label: 'Pending Fees', value: `RS ${stats.pendingFees.toLocaleString()}`, color: 'bg-red-500', link: '/fees' },
    { icon: AlertCircle, label: 'Overdue Fees', value: `RS ${stats.overdueFees.toLocaleString()}`, color: 'bg-orange-500', link: '/fees' },
    { icon: AlertCircle, label: 'Open Complaints', value: stats.complaints, color: 'bg-pink-500', link: '/complaints' },
    { icon: Wrench, label: 'Pending Maintenance', value: stats.maintenance, color: 'bg-purple-500', link: '/maintenance' },
    { icon: TrendingUp, label: 'Attendance Rate', value: `${stats.attendanceRate}%`, color: 'bg-teal-500', link: '/attendance' },
  ]

  const quickActions = [
    { label: 'Add Student', icon: Plus, link: '/students', color: 'bg-blue-500' },
    { label: 'Add Fee', icon: DollarSign, link: '/fees', color: 'bg-green-500' },
    { label: 'Mark Attendance', icon: ClipboardCheck, link: '/attendance', color: 'bg-yellow-500' },
    { label: 'New Complaint', icon: AlertCircle, link: '/complaints', color: 'bg-red-500' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.username || 'Admin'}!</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(action.link)}
                className={`${action.color} text-white p-4 rounded-lg hover:opacity-90 transition-opacity flex flex-col items-center gap-2`}
              >
                <Icon size={24} />
                <span className="text-sm font-medium">{action.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card hover:scale-105 transition-transform duration-200 cursor-pointer"
              onClick={() => stat.link && navigate(stat.link)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-4 rounded-full`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Fees Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Pending Fees</h2>
          {pendingFeesBreakdown.length > 0 ? (
            <div className="space-y-3">
              {pendingFeesBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.count} fee{item.count > 1 ? 's' : ''} pending</p>
                  </div>
                  <p className="font-bold text-red-600">RS {item.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No pending fees</p>
          )}
          <button
            onClick={() => navigate('/fees')}
            className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
          >
            View All Fees <ArrowRight size={16} />
          </button>
        </div>

        {/* Recent Activities */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activities</h2>
          {recentActivities.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-primary-100 rounded-full">
                      <Icon size={16} className="text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time.toLocaleDateString()} at {activity.time.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activities</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trends</h2>
          {monthlyTrends.length > 0 ? (
            <div className="space-y-4">
              {monthlyTrends.map((trend, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{trend.month}</span>
                    <span className="text-sm text-gray-600">
                      RS {trend.fees.toLocaleString()} | {trend.students} students
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${Math.min((trend.fees / Math.max(...monthlyTrends.map(t => t.fees))) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No trend data available</p>
          )}
        </div>

        {/* Upcoming Deadlines */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Deadlines</h2>
          {upcomingDeadlines.length > 0 ? (
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <div>
                    <p className="font-medium text-gray-800">{deadline.title}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Calendar size={14} />
                      {deadline.date.toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold text-yellow-600">RS {deadline.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
          )}
          <button
            onClick={() => navigate('/fees')}
            className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
          >
            View All Fees <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
