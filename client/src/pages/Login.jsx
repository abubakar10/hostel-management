import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Building2, Home, UserCog } from 'lucide-react'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('staff')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(username, password, role === 'resident' ? 'student' : 'admin')

    if (result.success) {
      if (result.user?.role === 'student') {
        navigate('/student/dashboard')
      } else {
        navigate('/dashboard')
      }
    } else {
      setError(result.error || 'Could not sign in. Check your details and try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-cream dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-primary-50 dark:bg-primary-900/30 rounded-2xl mb-4">
            <Building2 size={40} className="text-primary-700 dark:text-primary-400" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-2">Hostel office</h1>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            Sign in to check fees, rooms, and daily work.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setRole('resident')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold min-h-[48px] ${
              role === 'resident'
                ? 'bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-300'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Home size={18} />
            I live here
          </button>
          <button
            type="button"
            onClick={() => setRole('staff')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold min-h-[48px] ${
              role === 'staff'
                ? 'bg-white dark:bg-slate-800 text-primary-700 dark:text-primary-300'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <UserCog size={18} />
            I run the hostel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-[15px]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[15px] font-medium text-slate-700 dark:text-slate-300 mb-2">
              {role === 'resident' ? 'Your ID or email' : 'Your username or email'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              required
              autoComplete="username"
              placeholder={role === 'resident' ? 'e.g. STU-101 or your email' : 'e.g. office or your email'}
            />
          </div>

          <div>
            <label className="block text-[15px] font-medium text-slate-700 dark:text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />
            {role === 'resident' && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                First time? Use your student ID as the password, then change it from Forgot password.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3.5 text-base min-h-[52px]"
          >
            {loading ? 'Signing you in…' : 'Sign in'}
          </button>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-[15px] text-primary-700 dark:text-primary-400 hover:underline"
            >
              Forgot password? Get a reset link by email
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
