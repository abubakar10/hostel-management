# 🏠 Hostel Management System

A comprehensive, multi-hostel management system built with modern web technologies. This system allows super admins to manage multiple hostels, with each hostel having its own admin who can manage students, rooms, fees, attendance, complaints, staff, and generate detailed reports.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Installation & Setup](#-installation--setup)
- [Configuration](#-configuration)
- [Database Schema](#-database-schema)
- [API Documentation](#-api-documentation)
- [Multi-Hostel System](#-multi-hostel-system)
- [User Roles & Permissions](#-user-roles--permissions)
- [Deployment](#-deployment)
- [Usage Guide](#-usage-guide)
- [Security Features](#-security-features)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### 🎯 Core Functionalities

#### 1. **Multi-Hostel Management**
   - **Super Admin** can create and manage multiple hostels
   - Each hostel has its own dedicated admin
   - Complete data isolation between hostels
   - Hostel-specific statistics and reports

#### 2. **Student Management**
   - Add, edit, and delete student records
   - Complete student profile management:
     - Personal information (name, email, phone, address)
     - Academic details (course, year of study)
     - Room allocation
     - Status tracking (active/inactive)
   - Search and filter students
   - View student details and history
   - Automatic room assignment

#### 3. **Room Management**
   - Room type management (Single, Double, Triple, etc.)
   - Room creation with capacity and amenities
   - Real-time availability tracking
   - Room allocation to students
   - Floor-wise organization
   - Room status management (available, occupied, maintenance)
   - Current occupancy tracking
   - Room pricing per type

#### 4. **Fee Management**
   - Multiple fee types:
     - Hostel fees
     - Mess fees
     - Maintenance fees
     - Other charges
   - Fee payment tracking:
     - Paid fees
     - Pending fees
     - Overdue fees
   - Payment date tracking
   - Receipt generation and printing
   - Fee statistics dashboard
   - Due date reminders

#### 5. **Attendance Tracking**
   - Daily attendance marking
   - Bulk attendance entry
   - Monthly attendance reports
   - Attendance statistics:
     - Present/Absent count
     - Monthly attendance percentage
     - Attendance trends
   - Date-wise attendance view
   - Student-wise attendance history

#### 6. **Complaints & Maintenance**
   - Student complaint management
   - Maintenance request tracking
   - Status updates (pending, in-progress, resolved)
   - Priority assignment
   - Complaint categorization
   - Resolution tracking
   - Maintenance history

#### 7. **Staff Management**
   - Staff member registration
   - Staff categories:
     - Wardens
     - Cleaners
     - Security staff
     - Maintenance staff
   - Staff details:
     - Personal information
     - Contact details
     - Salary information
     - Shift timings
     - Employment status
   - Staff search and filter

#### 8. **Reports & Analytics**
   - **Income & Expenses Report**
     - Hostel income breakdown
     - Mess income tracking
     - Total expenses
     - Net profit/loss
   - **Profit/Loss Analysis**
     - Monthly profit/loss trends
     - Income vs expenses comparison
     - Visual charts and graphs
   - **Category Breakdown**
     - Income by category (pie charts)
     - Expenses by category
   - **Monthly Comparisons**
     - Month-over-month analysis
     - Yearly overview
   - Interactive charts using Recharts
   - Export capabilities

#### 9. **Notifications & Alerts**
   - System notifications
   - Payment reminders
   - Important alerts
   - Notification management:
     - Mark as read
     - Mark all as read
     - Delete notifications
   - Real-time notification updates

#### 10. **User Management** (Super Admin Only)
   - Create hostel admin users
   - Assign users to specific hostels
   - Edit user details
   - Delete users
   - Role management

#### 11. **Dashboard**
   - Overview statistics:
     - Total students
     - Total rooms
     - Total revenue
     - Pending fees
   - Quick access to all modules
   - Real-time data updates
   - Visual statistics cards

---

## 🛠 Tech Stack

### Frontend
- **React 19** - Latest React with modern features
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Recharts** - Interactive charts and graphs
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Modern icon library
- **date-fns** - Date utility library

### Backend
- **Node.js** (v20+) - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **JWT (jsonwebtoken)** - Authentication tokens
- **bcryptjs** - Password hashing
- **pg** - PostgreSQL client for Node.js
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Deployment
- **Netlify** - Frontend hosting
- **Vercel** - Backend serverless functions
- **Supabase** - PostgreSQL database hosting

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Dashboard│  │ Students │  │  Rooms   │  │   Fees   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Attendance│  │Complaints│  │  Staff   │  │  Reports │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP/REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Backend API (Express.js)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Auth   │  │ Students │  │  Rooms   │  │   Fees   │  │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Attendance│  │Complaints│  │  Staff   │  │  Reports │  │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Hostels  │  │   Users  │  │Notifications│              │
│  │  Routes  │  │  Routes  │  │   Routes  │              │
│  └──────────┘  └──────────┘  └──────────┘                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ SQL Queries
                       │
┌──────────────────────▼──────────────────────────────────────┐
│            PostgreSQL Database (Supabase)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  users   │  │ students │  │  rooms   │  │   fees   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │attendance│  │complaints│  │  staff   │  │expenses  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ hostels  │  │notifications│maintenance│                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** v20.0.0 or higher
- **npm** v9.0.0 or higher
- **PostgreSQL** v12 or higher (or use Supabase)
- **Git**

### Step 1: Clone the Repository

```bash
git clone https://github.com/abubakar10/hostel-management.git
cd hostel-management-system
```

### Step 2: Install Dependencies

Install all dependencies for root, server, and client:

```bash
npm run install-all
```

Or install individually:

```bash
# Root dependencies
npm install

# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### Step 3: Database Setup

#### Option A: Using Supabase (Recommended for Production)

1. Create a project on [Supabase](https://supabase.com)
2. Go to SQL Editor
3. Copy and paste the entire content of `SUPABASE_SQL_SETUP.sql`
4. Run the SQL script
5. Get your connection string from Supabase Dashboard → Settings → Database

#### Option B: Local PostgreSQL

1. Create a PostgreSQL database:
   ```bash
   createdb hostel_management
   ```

2. Run the schema:
   ```bash
   psql -U postgres -d hostel_management -f server/database/schema.sql
   ```

3. Run the multi-hostel upgrade:
   ```bash
   psql -U postgres -d hostel_management -f server/database/multi-hostel-schema.sql
   ```

### Step 4: Environment Variables

#### Server Environment (`server/.env`)

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (Option A: Connection String)
DATABASE_URL=postgresql://user:password@host:port/database

# Database Configuration (Option B: Individual Variables)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=hostel_management
DB_PASSWORD=your_password
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRE=7d

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

#### Client Environment (`client/.env`)

```env
# API URL (for production, use your backend URL)
VITE_API_URL=http://localhost:5000/api
```

### Step 5: Run the Application

#### Development Mode (Both Frontend & Backend)

```bash
# From root directory
npm run dev
```

This will start:
- **Backend server** on `http://localhost:5000`
- **Frontend dev server** on `http://localhost:5173`

#### Run Separately

**Backend only:**
```bash
cd server
npm run dev
```

**Frontend only:**
```bash
cd client
npm run dev
```

### Step 6: Default Login

After running the SQL setup script, you can login with:

- **Username:** `admin`
- **Password:** `admin123`
- **Role:** `super_admin`

**⚠️ Important:** Change the default password after first login!

---

## ⚙️ Configuration

### Database Connection

The system supports two connection methods:

1. **Connection String** (Recommended for production):
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   ```

2. **Individual Variables** (For local development):
   ```env
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=hostel_management
   DB_PASSWORD=password
   DB_PORT=5432
   ```

### Supabase Configuration

For Supabase, use the **Connection Pooler URL** (port 6543) for better performance:

```
postgresql://postgres.PROJECT_REF:PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

### CORS Configuration

Update `server/index.js` to add your frontend URL:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://your-frontend-url.netlify.app',
  // Add more origins as needed
];
```

---

## 🗄 Database Schema

### Core Tables

#### `users`
- User authentication and authorization
- Roles: `super_admin`, `admin`
- Hostel assignment for admins

#### `hostels`
- Hostel information
- Capacity and room counts
- Status tracking

#### `students`
- Student personal information
- Academic details
- Room assignment
- Hostel association

#### `rooms`
- Room details
- Room types
- Capacity and occupancy
- Hostel association

#### `room_types`
- Room type definitions
- Pricing
- Capacity specifications

#### `fees`
- Fee records
- Payment tracking
- Fee types (hostel, mess, etc.)
- Due dates

#### `attendance`
- Daily attendance records
- Student attendance tracking
- Date-wise records

#### `complaints`
- Student complaints
- Status tracking
- Resolution notes

#### `maintenance_requests`
- Maintenance requests
- Priority levels
- Status updates

#### `staff`
- Staff member information
- Roles and responsibilities
- Salary details
- Shift information

#### `expenses`
- Expense tracking
- Categories
- Amount and date

#### `notifications`
- System notifications
- Alerts and reminders
- Read status

### Relationships

- `users.hostel_id` → `hostels.id` (for admin users)
- `students.hostel_id` → `hostels.id`
- `students.room_id` → `rooms.id`
- `rooms.hostel_id` → `hostels.id`
- `rooms.room_type_id` → `room_types.id`
- `fees.student_id` → `students.id`
- `fees.hostel_id` → `hostels.id`
- All other tables have `hostel_id` for multi-hostel support

---

## 📡 API Documentation

### Base URL
- **Development:** `http://localhost:5000/api`
- **Production:** `https://your-backend-url.vercel.app/api`

### Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication

**POST** `/api/auth/login`
- Login user
- **Body:**
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Login successful",
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "super_admin",
      "hostel_id": null
    }
  }
  ```

**POST** `/api/auth/register`
- Register new user (admin only)
- **Body:**
  ```json
  {
    "username": "newuser",
    "email": "user@example.com",
    "password": "password123",
    "role": "admin",
    "hostel_id": 1
  }
  ```

#### Students

- **GET** `/api/students` - Get all students (filtered by hostel)
- **GET** `/api/students/:id` - Get student by ID
- **POST** `/api/students` - Create student
- **PUT** `/api/students/:id` - Update student
- **DELETE** `/api/students/:id` - Delete student

#### Rooms

- **GET** `/api/rooms` - Get all rooms
- **GET** `/api/rooms/availability/available` - Get available rooms
- **GET** `/api/rooms/types` - Get room types
- **POST** `/api/rooms` - Create room
- **PUT** `/api/rooms/:id` - Update room
- **POST** `/api/rooms/allocate` - Allocate room to student
- **DELETE** `/api/rooms/:id` - Delete room

#### Fees

- **GET** `/api/fees` - Get all fees
- **GET** `/api/fees/stats` - Get fee statistics
- **POST** `/api/fees` - Create fee
- **PUT** `/api/fees/:id` - Update fee (mark as paid)
- **GET** `/api/fees/receipts/all` - Get all receipts
- **GET** `/api/fees/receipts/:id` - Get receipt by ID

#### Attendance

- **GET** `/api/attendance` - Get attendance records
- **GET** `/api/attendance/daily/:date` - Get daily attendance
- **POST** `/api/attendance` - Create/update attendance
- **POST** `/api/attendance/bulk` - Bulk attendance entry
- **GET** `/api/attendance/monthly/:year/:month` - Monthly report
- **GET** `/api/attendance/stats` - Attendance statistics

#### Complaints

- **GET** `/api/complaints` - Get all complaints
- **POST** `/api/complaints` - Create complaint
- **PUT** `/api/complaints/:id` - Update complaint
- **DELETE** `/api/complaints/:id` - Delete complaint
- **GET** `/api/complaints/maintenance/all` - Get maintenance requests
- **POST** `/api/complaints/maintenance` - Create maintenance request
- **PUT** `/api/complaints/maintenance/:id` - Update maintenance request

#### Staff

- **GET** `/api/staff` - Get all staff
- **GET** `/api/staff/:id` - Get staff by ID
- **POST** `/api/staff` - Create staff
- **PUT** `/api/staff/:id` - Update staff
- **DELETE** `/api/staff/:id` - Delete staff

#### Reports

- **GET** `/api/reports/income-expenses/:year/:month` - Income & expenses
- **GET** `/api/reports/profit-loss/:year` - Profit/loss analysis
- **GET** `/api/reports/category-breakdown/:year/:month` - Category breakdown
- **GET** `/api/reports/monthly-comparison/:year` - Monthly comparison

#### Notifications

- **GET** `/api/notifications` - Get notifications
- **POST** `/api/notifications` - Create notification
- **PUT** `/api/notifications/:id/read` - Mark as read
- **PUT** `/api/notifications/read-all` - Mark all as read
- **DELETE** `/api/notifications/:id` - Delete notification

#### Hostels (Super Admin Only)

- **GET** `/api/hostels` - Get all hostels
- **GET** `/api/hostels/:id` - Get hostel by ID
- **GET** `/api/hostels/:id/stats` - Get hostel statistics
- **POST** `/api/hostels` - Create hostel
- **PUT** `/api/hostels/:id` - Update hostel
- **DELETE** `/api/hostels/:id` - Delete hostel

#### Users (Super Admin Only)

- **GET** `/api/users` - Get all users
- **GET** `/api/users/:id` - Get user by ID
- **POST** `/api/users` - Create user
- **PUT** `/api/users/:id` - Update user
- **DELETE** `/api/users/:id` - Delete user

---

## 🏢 Multi-Hostel System

### Overview

The system supports managing multiple hostels with complete data isolation. Each hostel operates independently with its own admin, students, rooms, fees, and reports.

### How It Works

1. **Super Admin** creates hostels
2. **Super Admin** creates admin users and assigns them to hostels
3. **Hostel Admins** can only access their assigned hostel's data
4. All data is automatically filtered by `hostel_id`

### Creating a Hostel

1. Login as super admin
2. Navigate to "Hostels" page
3. Click "Add Hostel"
4. Fill in details:
   - Name
   - Address
   - Phone
   - Email
   - Total rooms
   - Total capacity
5. Click "Create Hostel"

### Creating a Hostel Admin

1. Login as super admin
2. Navigate to "Users" page
3. Click "Add User"
4. Fill in details:
   - Username
   - Email
   - Password
   - Role: "Admin"
   - Select Hostel
5. Click "Create User"

### Data Isolation

- Students are automatically assigned to the admin's hostel
- Rooms belong to specific hostels
- Fees are tracked per hostel
- Reports are generated per hostel
- All queries automatically filter by `hostel_id`

---

## 👥 User Roles & Permissions

### Super Admin

**Capabilities:**
- ✅ Create, edit, and delete hostels
- ✅ Create, edit, and delete users
- ✅ Access all hostels' data
- ✅ View system-wide statistics
- ✅ Manage all hostels' operations

**Restrictions:**
- None (full system access)

### Hostel Admin

**Capabilities:**
- ✅ Manage students (their hostel only)
- ✅ Manage rooms (their hostel only)
- ✅ Manage fees (their hostel only)
- ✅ Track attendance (their hostel only)
- ✅ Handle complaints (their hostel only)
- ✅ Manage staff (their hostel only)
- ✅ Generate reports (their hostel only)
- ✅ View notifications

**Restrictions:**
- ❌ Cannot access other hostels' data
- ❌ Cannot create hostels
- ❌ Cannot manage users
- ❌ Cannot access super admin features

---

## 🚢 Deployment

### Frontend Deployment (Netlify)

1. **Build the frontend:**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy to Netlify:**
   - Connect your GitHub repository
   - Set build command: `cd client && npm install && npm run build`
   - Set publish directory: `client/dist`
   - Add environment variable: `VITE_API_URL=https://your-backend-url.vercel.app/api`

### Backend Deployment (Vercel)

1. **Prepare for Vercel:**
   - Ensure `server/vercel.json` exists
   - Ensure `server/api/index.js` exists

2. **Deploy to Vercel:**
   - Connect your GitHub repository
   - Set root directory: `server`
   - Add environment variables:
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `JWT_EXPIRE`
     - `FRONTEND_URL`
     - `NODE_ENV=production`

3. **Database Setup:**
   - Use Supabase Connection Pooler URL
   - Format: `postgresql://postgres.PROJECT_REF:PASSWORD@pooler.supabase.com:6543/postgres`

### Environment Variables for Production

**Vercel (Backend):**
```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:PASSWORD@pooler.supabase.com:6543/postgres
JWT_SECRET=your_production_jwt_secret
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend.netlify.app
NODE_ENV=production
```

**Netlify (Frontend):**
```env
VITE_API_URL=https://your-backend.vercel.app/api
```

---

## 📖 Usage Guide

### For Super Admin

1. **Login** with super admin credentials
2. **Create Hostels:**
   - Go to "Hostels" page
   - Click "Add Hostel"
   - Fill in details and save

3. **Create Hostel Admins:**
   - Go to "Users" page
   - Click "Add User"
   - Select role "Admin" and assign hostel

4. **Monitor All Hostels:**
   - View statistics for all hostels
   - Access any hostel's data

### For Hostel Admin

1. **Login** with your credentials
2. **Add Students:**
   - Go to "Students" page
   - Click "Add Student"
   - Fill in student details
   - Student is automatically assigned to your hostel

3. **Manage Rooms:**
   - Go to "Rooms" page
   - Create room types
   - Add rooms
   - Allocate rooms to students

4. **Manage Fees:**
   - Go to "Fees" page
   - Create fee records
   - Mark fees as paid
   - Generate receipts

5. **Track Attendance:**
   - Go to "Attendance" page
   - Mark daily attendance
   - Use bulk attendance for multiple students
   - View monthly reports

6. **Handle Complaints:**
   - Go to "Complaints" page
   - View and respond to complaints
   - Create maintenance requests
   - Update status

7. **Manage Staff:**
   - Go to "Staff" page
   - Add staff members
   - Update staff information

8. **Generate Reports:**
   - Go to "Reports" page
   - View income/expenses
   - Analyze profit/loss
   - View category breakdowns

---

## 🔒 Security Features

### Authentication & Authorization

- **JWT-based authentication** - Secure token-based auth
- **Password hashing** - bcryptjs with salt rounds
- **Role-based access control** - Super admin vs Admin
- **Hostel data isolation** - Automatic filtering by hostel_id

### Database Security

- **Row Level Security (RLS)** - Enabled on all tables
- **SQL injection prevention** - Parameterized queries
- **Connection pooling** - Optimized for serverless
- **SSL/TLS encryption** - Secure database connections

### API Security

- **CORS protection** - Whitelisted origins only
- **JWT token validation** - On all protected routes
- **Input validation** - Request body validation
- **Error handling** - Secure error messages

### Best Practices

- Environment variables for sensitive data
- No hardcoded credentials
- Secure password requirements
- Token expiration (7 days default)

---

## 🐛 Troubleshooting

### Database Connection Issues

**Error:** `getaddrinfo ENOTFOUND`
- **Solution:** Check your `DATABASE_URL` hostname
- Use Supabase Connection Pooler URL (port 6543)

**Error:** `SELF_SIGNED_CERT_IN_CHAIN`
- **Solution:** The code automatically handles this
- Ensure `rejectUnauthorized: false` in SSL config

**Error:** `password authentication failed`
- **Solution:** Verify username and password in `DATABASE_URL`
- For Supabase pooler, username format: `postgres.PROJECT_REF`

### Frontend Issues

**Error:** `Cannot GET /api/...`
- **Solution:** Check `VITE_API_URL` in client environment
- Verify backend is running and accessible

**Error:** `CORS error`
- **Solution:** Add your frontend URL to backend CORS whitelist
- Check `FRONTEND_URL` environment variable

### Build Issues

**Error:** `Module not found`
- **Solution:** Run `npm install` in both client and server directories
- Delete `node_modules` and reinstall if needed

**Error:** `Port already in use`
- **Solution:** Change `PORT` in `server/.env`
- Or kill the process using the port

### Deployment Issues

**Vercel:** `Cannot GET /api/auth/login`
- **Solution:** Ensure `server/vercel.json` is configured
- Check `server/api/index.js` exists

**Netlify:** Build fails
- **Solution:** Check Node.js version (use `.nvmrc`)
- Verify build command and publish directory

---

## 📝 Project Structure

```
hostel-management-system/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/          # Reusable components
│   │   │   ├── Header.jsx       # Top navigation bar
│   │   │   ├── Sidebar.jsx      # Side navigation menu
│   │   │   ├── Layout.jsx       # Main layout wrapper
│   │   │   └── PrivateRoute.jsx # Protected route wrapper
│   │   ├── pages/               # Page components
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── Dashboard.jsx   # Dashboard/home
│   │   │   ├── Students.jsx    # Student management
│   │   │   ├── Rooms.jsx       # Room management
│   │   │   ├── Fees.jsx        # Fee management
│   │   │   ├── Attendance.jsx  # Attendance tracking
│   │   │   ├── Complaints.jsx  # Complaints & maintenance
│   │   │   ├── Staff.jsx       # Staff management
│   │   │   ├── Reports.jsx     # Reports & analytics
│   │   │   ├── Notifications.jsx # Notifications
│   │   │   ├── Hostels.jsx     # Hostel management (super admin)
│   │   │   └── Users.jsx       # User management (super admin)
│   │   ├── context/            # React context
│   │   │   └── AuthContext.jsx # Authentication context
│   │   ├── config/             # Configuration
│   │   │   └── api.js          # Axios API configuration
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Global styles
│   ├── package.json
│   ├── vite.config.js
│   └── netlify.toml
│
├── server/                      # Backend Express application
│   ├── routes/                  # API routes
│   │   ├── auth.js             # Authentication routes
│   │   ├── students.js         # Student routes
│   │   ├── rooms.js            # Room routes
│   │   ├── fees.js             # Fee routes
│   │   ├── attendance.js       # Attendance routes
│   │   ├── complaints.js      # Complaint routes
│   │   ├── staff.js            # Staff routes
│   │   ├── reports.js          # Report routes
│   │   ├── notifications.js    # Notification routes
│   │   ├── hostels.js          # Hostel routes
│   │   └── users.js            # User routes
│   ├── middleware/              # Express middleware
│   │   ├── auth.js             # JWT authentication
│   │   └── hostel.js           # Hostel filtering
│   ├── config/                  # Configuration
│   │   └── database.js         # Database connection
│   ├── database/                # Database files
│   │   ├── schema.sql          # Initial schema
│   │   ├── multi-hostel-schema.sql # Multi-hostel upgrade
│   │   └── seed.js             # Seed data
│   ├── api/                     # Vercel serverless
│   │   └── index.js            # Serverless entry point
│   ├── index.js                # Main server file
│   ├── package.json
│   ├── vercel.json             # Vercel configuration
│   └── .env                    # Environment variables
│
├── SUPABASE_SQL_SETUP.sql      # Complete Supabase setup
├── SUPABASE_RLS_POLICIES.sql   # Row Level Security policies
├── README.md                   # This file
└── package.json                # Root package.json
```

---

## 🎨 UI Features

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Modern Animations** - Smooth transitions with Framer Motion
- **Interactive Charts** - Beautiful charts with Recharts
- **Dark/Light Theme Ready** - Easy to customize
- **Accessible** - Keyboard navigation and screen reader support
- **Loading States** - Visual feedback during API calls
- **Error Handling** - User-friendly error messages
- **Form Validation** - Real-time input validation

---

## 🔄 Version History

### v1.0.0 (Current)
- ✅ Multi-hostel support
- ✅ Complete CRUD operations for all modules
- ✅ Role-based access control
- ✅ Comprehensive reporting
- ✅ Real-time notifications
- ✅ Responsive UI
- ✅ Production-ready deployment

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Malik Abubakar Shafeeq**

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📞 Support

For support, email abubakar.shafeeq@itcs.com.pk or create an issue in the repository.

---

## 🙏 Acknowledgments

- React Team for the amazing framework
- Vite for the fast build tool
- Tailwind CSS for the utility-first CSS
- Supabase for the database hosting
- All open-source contributors

---

**Made with ❤️ for efficient hostel management**
