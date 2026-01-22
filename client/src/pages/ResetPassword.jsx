import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import api from '../config/api'

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const userType = searchParams.get('type') || 'admin'
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  useEffect(() => {
    // Validate token on mount
    if (!token) {
      setError('Reset token is missing')
      setValidating(false)
      return
    }

    const validateToken = async () => {
      try {
        const response = await api.post('/api/auth/verify-reset-token', {
          token,
          userType
        })
        if (response.data.valid) {
          setTokenValid(true)
        } else {
          setError('Invalid or expired reset token')
        }
      } catch (error) {
        setError(error.response?.data?.error || 'Invalid or expired reset token')
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token, userType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await api.post('/api/auth/reset-password', {
        token,
        password: formData.password,
        userType
      })

      if (response.data.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Validating reset token...</p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md"
        >
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
              <AlertCircle size={48} className="text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Invalid Token
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
              {error || 'This reset token is invalid or has expired. Please request a new one.'}
            </p>
            <Link
              to="/forgot-password"
              className="btn-primary inline-block min-h-[48px] sm:min-h-[44px]"
            >
              Request New Reset Link
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 flex items-center justify-center p-4 transition-colors duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md transition-colors duration-200"
      >
        {!success ? (
          <>
            <div className="text-center mb-6 sm:mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="inline-block p-3 sm:p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4"
              >
                <Lock size={40} className="sm:w-12 sm:h-12 text-primary-600 dark:text-primary-400" />
              </motion.div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                Reset Password
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Enter your new password
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm sm:text-base"
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm pr-10"
                    required
                    placeholder="Enter new password (min. 6 characters)"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm pr-10"
                    required
                    placeholder="Confirm new password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 sm:py-3.5 text-base sm:text-lg min-h-[48px] sm:min-h-[44px] shadow-lg active:scale-95 transition-transform"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </motion.button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 sm:space-y-6"
          >
            <div className="inline-block p-4 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Password Reset Successful!
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">
              Your password has been reset successfully. You will be redirected to the login page shortly.
            </p>
            <Link
              to="/login"
              className="btn-primary inline-block min-h-[48px] sm:min-h-[44px]"
            >
              Go to Login
            </Link>
          </motion.div>
        )}

        {!success && (
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm sm:text-base text-primary-600 dark:text-primary-400 hover:underline"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default ResetPassword

