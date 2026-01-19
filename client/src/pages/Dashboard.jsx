import { useEffect, useState } from 'react'
import api from '../config/api'
import { motion } from 'framer-motion'
import {
  Users,
  Home,
  DollarSign,
  ClipboardCheck,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

const Dashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    rooms: 0,
    totalFees: 0,
    pendingFees: 0,
    complaints: 0,
    attendance: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [students, rooms, fees, complaints] = await Promise.all([
        api.get('/api/students'),
        api.get('/api/rooms'),
        api.get('/api/fees'),
        api.get('/api/complaints')
      ])

      const totalFees = fees.data
        .filter(f => f.status === 'paid')
        .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)
      
      const pendingFees = fees.data
        .filter(f => f.status === 'pending')
        .reduce((sum, f) => sum + parseFloat(f.amount || 0), 0)

      setStats({
        students: students.data.length,
        rooms: rooms.data.length,
        totalFees,
        pendingFees,
        complaints: complaints.data.filter(c => c.status === 'open').length,
        attendance: 0
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { icon: Users, label: 'Total Students', value: stats.students, color: 'bg-blue-500' },
    { icon: Home, label: 'Total Rooms', value: stats.rooms, color: 'bg-green-500' },
    { icon: DollarSign, label: 'Total Revenue', value: `₹${stats.totalFees.toLocaleString()}`, color: 'bg-yellow-500' },
    { icon: AlertCircle, label: 'Pending Fees', value: `₹${stats.pendingFees.toLocaleString()}`, color: 'bg-red-500' },
    { icon: AlertCircle, label: 'Open Complaints', value: stats.complaints, color: 'bg-orange-500' },
    { icon: TrendingUp, label: 'Attendance Rate', value: '95%', color: 'bg-purple-500' },
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
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to Hostel Management System</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:scale-105 transition-transform duration-200"
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
    </div>
  )
}

export default Dashboard

