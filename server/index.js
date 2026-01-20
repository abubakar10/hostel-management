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
import visitorRoutes from './routes/visitors.js';
import leaveRoutes from './routes/leaves.js';
import messRoutes from './routes/mess.js';
import inventoryRoutes from './routes/inventory.js';
import documentRoutes from './routes/documents.js';
import roomTransferRoutes from './routes/roomTransfers.js';
import studentPortalRoutes from './routes/studentPortal.js';

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
app.use('/api/visitors', visitorRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/room-transfers', roomTransferRoutes);
app.use('/api/student', studentPortalRoutes);

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
    const result = await pool.query('SELECT NOW(), version()');
    console.log('✅ Database connected successfully');
    console.log('   Current time:', result.rows[0].now);
    
    // Test if tables exist
    const tablesResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`   Tables found: ${tablesResult.rows[0].count}`);
    
    // Check if users table exists
    const usersTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (!usersTable.rows[0].exists) {
      console.warn('⚠️  Warning: users table not found. Run SUPABASE_SQL_SETUP.sql in Supabase SQL Editor.');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('   Error code:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.error('   → DNS resolution failed. Check your DATABASE_URL hostname.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   → Connection refused. Check host and port in DATABASE_URL.');
    } else if (error.code === '28P01') {
      console.error('   → Authentication failed. Check username and password in DATABASE_URL.');
    } else if (error.code === '42P01') {
      console.error('   → Table does not exist. Run SUPABASE_SQL_SETUP.sql in Supabase SQL Editor.');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('   → Connection timeout. Check your network and DATABASE_URL.');
    }
    
    // Log connection string (masked) for debugging
    if (process.env.DATABASE_URL) {
      const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@');
      console.error('   Connection string:', maskedUrl);
    }
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
