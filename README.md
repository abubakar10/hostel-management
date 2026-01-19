# Hostel Management System

A comprehensive hostel management system built with React 19, Vite, Tailwind CSS, Node.js, Express, and PostgreSQL.

## Features

### Core Modules

1. **Student Management**
   - Add/Edit/Delete students
   - View student records
   - Student profile management

2. **Room Management**
   - Room allocation
   - Room availability tracking
   - Capacity & room types management

3. **Fee Management**
   - Hostel fees
   - Mess fees
   - Payments & dues tracking
   - Receipt generation

4. **Attendance Tracking**
   - Daily attendance
   - Monthly reports
   - Attendance statistics

5. **Complaints & Maintenance**
   - Manage complaints
   - Maintenance requests
   - Status tracking

6. **Staff Management**
   - Wardens
   - Cleaners
   - Security staff

7. **Reports & Analytics**
   - Monthly income & expenses
   - Profit/Loss analysis
   - Category breakdown
   - Monthly comparisons

8. **Notifications & Alerts**
   - New alerts
   - Reminders
   - Notification management

## Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- Framer Motion (animations)
- Recharts (charts)
- React Router DOM
- Axios

### Backend
- Node.js
- Express
- PostgreSQL
- JWT Authentication
- bcryptjs

## Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hostel-management-system
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Database Setup**
   - Create a PostgreSQL database named `hostel_management`
   - Update database credentials in `server/.env` (copy from `server/.env.example`)
   - Run the schema:
     ```bash
     psql -U postgres -d hostel_management -f server/database/schema.sql
     ```
   - Create default admin user:
     ```bash
     cd server
     node database/seed.js
     ```

4. **Environment Variables**
   - Create `server/.env` file:
     ```env
     PORT=5000
     DB_USER=postgres
     DB_HOST=localhost
     DB_NAME=hostel_management
     DB_PASSWORD=your_password
     DB_PORT=5432
     JWT_SECRET=your_jwt_secret_key_here
     JWT_EXPIRE=7d
     ```

5. **Run the application**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend development server on `http://localhost:3000`

## Default Login Credentials

- Username: `admin`
- Password: `admin123`

(Note: You may need to register a new user or update the default password in the database)

## Project Structure

```
hostel-management-system/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   └── ...
│   └── ...
├── server/                 # Backend Express application
│   ├── routes/            # API routes
│   ├── config/            # Configuration files
│   ├── middleware/        # Express middleware
│   ├── database/          # Database schema
│   └── ...
└── ...
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/availability/available` - Get available rooms
- `POST /api/rooms` - Create room
- `PUT /api/rooms/:id` - Update room
- `POST /api/rooms/allocate` - Allocate room to student

### Fees
- `GET /api/fees` - Get all fees
- `POST /api/fees` - Create fee
- `PUT /api/fees/:id` - Update fee (mark as paid)
- `GET /api/fees/receipts/all` - Get all receipts

### Attendance
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/daily/:date` - Get daily attendance
- `POST /api/attendance` - Create/update attendance
- `POST /api/attendance/bulk` - Bulk attendance
- `GET /api/attendance/monthly/:year/:month` - Monthly report

### Complaints
- `GET /api/complaints` - Get all complaints
- `POST /api/complaints` - Create complaint
- `PUT /api/complaints/:id` - Update complaint
- `GET /api/complaints/maintenance/all` - Get maintenance requests
- `POST /api/complaints/maintenance` - Create maintenance request

### Staff
- `GET /api/staff` - Get all staff
- `POST /api/staff` - Create staff
- `PUT /api/staff/:id` - Update staff
- `DELETE /api/staff/:id` - Delete staff

### Reports
- `GET /api/reports/income-expenses/:year/:month` - Income & expenses
- `GET /api/reports/profit-loss/:year` - Profit/loss analysis
- `GET /api/reports/category-breakdown/:year/:month` - Category breakdown
- `GET /api/reports/monthly-comparison/:year` - Monthly comparison

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Create notification
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## Features

- ✅ Responsive design for all screen sizes
- ✅ Modern UI with Tailwind CSS
- ✅ Smooth animations with Framer Motion
- ✅ Interactive charts and graphs
- ✅ Real-time data updates
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Comprehensive reporting

## Development

### Frontend Development
```bash
cd client
npm run dev
```

### Backend Development
```bash
cd server
npm run dev
```

### Build for Production
```bash
cd client
npm run build
```

## License

This project is licensed under the MIT License.

