import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../config/api'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const response = await api.post('/api/auth/forgot-password', {
        email
      })

      if (response.data.success) {
        setSuccess(true)
        setEmailSent(response.data.emailSent || false)
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send reset link. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 flex items-center justify-center p-4 transition-colors duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md transition-colors duration-200"
      >
        <div className="text-center mb-6 sm:mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-block p-3 sm:p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4"
          >
            <Mail size={40} className="sm:w-12 sm:h-12 text-primary-600 dark:text-primary-400" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Forgot Password
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Enter your email or student ID to receive a password reset link
          </p>
        </div>

        {!success ? (
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
                Email Address or Student ID
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field min-h-[48px] sm:min-h-[44px] text-base sm:text-sm"
                required
                placeholder="Enter your email address or student ID"
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                We'll automatically detect your account type
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 sm:py-3.5 text-base sm:text-lg min-h-[48px] sm:min-h-[44px] shadow-lg active:scale-95 transition-transform"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </motion.button>
          </form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle size={24} className="flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold mb-2">Reset link sent successfully!</p>
                  <p className="text-sm mb-3">
                    {emailSent
                      ? 'A password reset link has been sent to your email address. Please check your inbox (and spam folder) and click the link to reset your password.'
                      : 'Password reset token has been generated. Please check your server console/terminal for the reset link (email not configured).'
                    }
                  </p>
                  {!emailSent && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-3 rounded mb-3">
                      <p className="text-xs text-yellow-800 dark:text-yellow-300 font-medium mb-1">
                        ⚠️ Email not configured
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        Check your server console/terminal for the reset token and link. See EMAIL_SETUP.md for configuration instructions.
                      </p>
                    </div>
                  )}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded">
                    <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1">
                      📧 Next Steps:
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-blue-400 list-disc list-inside space-y-1">
                      <li>Check your email inbox (and spam folder)</li>
                      <li>Click the reset password link in the email</li>
                      <li>The link will expire in 1 hour</li>
                      <li>If you didn't receive the email, check server logs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <Link
              to="/login"
              className="block w-full btn-primary py-3 sm:py-3.5 text-base sm:text-lg min-h-[48px] sm:min-h-[44px] shadow-lg text-center"
            >
              Back to Login
            </Link>
          </motion.div>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm sm:text-base text-primary-600 dark:text-primary-400 hover:underline"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPassword

