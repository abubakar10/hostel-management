import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../config/api'
import {
  Users,
  Home,
  DollarSign,
  ClipboardCheck,
  AlertCircle,
  Plus,
  Wrench,
  Calendar,
  ArrowRight,
  Percent
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useHostel } from '../context/HostelContext'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'

const Dashboard = () => {
  const { user } = useAuth()
  const { isSuperAdmin, selectedHostelId } = useHostel()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isSuperAdmin && !selectedHostelId) return
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 300000)
    return () => clearInterval(interval)
  }, [isSuperAdmin, selectedHostelId])

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/api/reports/overview')
      setStats(data)
      setError('')
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Could not load today’s numbers. Check your connection and try again.')
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

  if (error || !stats) {
    return (
      <div className="card">
        <p className="text-slate-700 dark:text-slate-200">{error || 'Nothing to show yet.'}</p>
      </div>
    )
  }

  const statCards = [
    { icon: Users, label: 'People living here', value: stats.students, hint: 'Open the people list', link: '/students', tone: 'bg-teal-600' },
    { icon: Home, label: 'Rooms in use', value: `${stats.occupiedRooms}/${stats.totalRooms}`, hint: 'Who is in which room', link: '/rooms', tone: 'bg-emerald-600' },
    { icon: Percent, label: 'Beds filled', value: `${stats.occupancyRate}%`, hint: 'Space still free', link: '/rooms', tone: 'bg-cyan-700' },
    { icon: DollarSign, label: 'Money collected', value: `RS ${Number(stats.totalFees || 0).toLocaleString()}`, hint: 'Paid so far', link: '/fees', tone: 'bg-amber-600' },
    { icon: AlertCircle, label: 'Still to collect', value: `RS ${Number(stats.pendingFees || 0).toLocaleString()}`, hint: 'Open the payments page', link: '/fees', tone: 'bg-orange-600' },
    { icon: AlertCircle, label: 'Late payments', value: `RS ${Number(stats.overdueFees || 0).toLocaleString()}`, hint: 'Past the due date', link: '/fees', tone: 'bg-red-600' },
    { icon: AlertCircle, label: 'Open problems', value: stats.complaints, hint: 'Complaints not finished', link: '/complaints', tone: 'bg-rose-600' },
    { icon: Wrench, label: 'Repairs waiting', value: stats.maintenance, hint: 'Jobs not started', link: '/maintenance', tone: 'bg-slate-600' },
    { icon: ClipboardCheck, label: 'Present today', value: `${stats.attendanceRate}%`, hint: 'Mark attendance', link: '/attendance', tone: 'bg-primary-600' },
  ]

  const quickActions = [
    { label: 'Add a person', icon: Plus, link: '/students' },
    { label: 'Record a payment', icon: DollarSign, link: '/fees' },
    { label: 'Mark who is here', icon: ClipboardCheck, link: '/attendance' },
    { label: 'Log a problem', icon: AlertCircle, link: '/complaints' },
  ]

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title={`Hello, ${user?.username || 'there'}`}
        subtitle="This is today’s picture of the hostel. Tap a box to open that work."
      />

      <div className="card">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
          Common jobs
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.link)}
                className="bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200 p-4 rounded-2xl flex flex-col items-center gap-2 min-h-[88px] justify-center border border-primary-100 dark:border-primary-800"
              >
                <Icon size={22} />
                <span className="text-sm font-semibold text-center">{action.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <button
              key={stat.label}
              onClick={() => navigate(stat.link)}
              className="card text-left hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{stat.label}</p>
                  <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100 truncate">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.hint}</p>
                </div>
                <div className={`${stat.tone} p-3 rounded-2xl flex-shrink-0`}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Who still owes money
          </h2>
          {stats.topPending?.length > 0 ? (
            <div className="space-y-2">
              {stats.topPending.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-cream dark:bg-slate-700 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {item.first_name} {item.last_name}
                    </p>
                    <p className="text-sm text-slate-500">{item.count} unpaid bill{item.count > 1 ? 's' : ''}</p>
                  </div>
                  <p className="font-semibold text-red-700 dark:text-red-400">
                    RS {Number(item.amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Nobody owes money right now" hint="New bills will show up here." />
          )}
          <button onClick={() => navigate('/fees')} className="mt-3 text-primary-700 dark:text-primary-400 text-sm font-medium flex items-center gap-1 min-h-[44px]">
            Open payments <ArrowRight size={14} />
          </button>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Latest people added
          </h2>
          {stats.recentPeople?.length > 0 ? (
            <div className="space-y-2">
              {stats.recentPeople.map((person, index) => (
                <div key={index} className="p-3 bg-cream dark:bg-slate-700 rounded-xl">
                  <p className="text-sm text-slate-800 dark:text-slate-100">
                    {person.first_name} {person.last_name} joined
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {person.created_at ? new Date(person.created_at).toLocaleDateString() : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No people added yet" hint="Use Add a person on the People page." />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Payments due this week
          </h2>
          {stats.dueSoon?.length > 0 ? (
            <div className="space-y-2">
              {stats.dueSoon.map((deadline, index) => (
                <div key={index} className="flex items-center justify-between gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border-l-4 border-amber-500">
                  <div>
                    <p className="font-medium text-sm text-slate-800 dark:text-slate-100">
                      {deadline.first_name} {deadline.last_name}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <Calendar size={12} />
                      {new Date(deadline.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">
                    RS {Number(deadline.amount).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Nothing due in the next 7 days" />
          )}
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
            Open problems
          </h2>
          {stats.openProblems?.length > 0 ? (
            <div className="space-y-2">
              {stats.openProblems.map((item, index) => (
                <div key={index} className="p-3 bg-cream dark:bg-slate-700 rounded-xl">
                  <p className="text-sm text-slate-800 dark:text-slate-100">{item.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No open problems" hint="Residents can send problems from their phone." />
          )}
          <button onClick={() => navigate('/complaints')} className="mt-3 text-primary-700 dark:text-primary-400 text-sm font-medium flex items-center gap-1 min-h-[44px]">
            Open problems <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
