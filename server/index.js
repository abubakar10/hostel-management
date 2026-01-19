import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './config/database.js';
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import roomRoutes from './routes/rooms.js';
import feeRoutes from './routes/fees.js';
import attendanceRoutes from './routes/attendance.js';
import complaintRoutes from './routes/complaints.js';
import staffRoutes from './routes/staff.js';
import reportRoutes from './routes/reports.js';
import notificationRoutes from './routes/notifications.js';
import hostelRoutes from './routes/hostels.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://*.netlify.app',
      'https://*.vercel.app',
      process.env.FRONTEND_URL,
      process.env.NETLIFY_URL
    ].filter(Boolean);
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        // Handle wildcard patterns
        const pattern = allowed.replace('*', '.*');
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return origin === allowed;
    });
    
    if (isAllowed || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/users', userRoutes);

// Health check with database connection test
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    res.json({ 
      status: 'OK', 
      message: 'Server is running',
      database: 'connected'
    });
  } catch (error) {
    console.error('Health check database error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Server is running but database connection failed',
      database: 'disconnected',
      error: error.message,
      code: error.code
    });
  }
});

// Root route for Vercel
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Hostel Management System API',
    version: '1.0.0',
    endpoints: '/api/health, /api/auth, /api/students, etc.'
  });
});

// Initialize database
const initializeDatabase = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
};

// Export app for Vercel serverless
export default app;

// Start server if not in Vercel environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    initializeDatabase();
  });
} else {
  // Initialize database connection for Vercel
  initializeDatabase();
}
