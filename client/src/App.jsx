import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { ThemeProvider } from './context/ThemeContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Rooms from './pages/Rooms'
import Fees from './pages/Fees'
import Attendance from './pages/Attendance'
import Complaints from './pages/Complaints'
import Maintenance from './pages/Maintenance'
import Visitors from './pages/Visitors'
import Leaves from './pages/Leaves'
import Mess from './pages/Mess'
import Inventory from './pages/Inventory'
import Documents from './pages/Documents'
import RoomTransfers from './pages/RoomTransfers'
import Staff from './pages/Staff'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import Hostels from './pages/Hostels'
import Users from './pages/Users'
import Layout from './components/Layout'
import StudentLogin from './pages/StudentLogin'
import StudentLayout from './components/StudentLayout'
import StudentPrivateRoute from './components/StudentPrivateRoute'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentProfile from './pages/student/StudentProfile'
import StudentFees from './pages/student/StudentFees'
import StudentComplaints from './pages/student/StudentComplaints'
import StudentLeaves from './pages/student/StudentLeaves'
import StudentAttendance from './pages/student/StudentAttendance'
import StudentRoomTransfers from './pages/student/StudentRoomTransfers'
import StudentNotifications from './pages/student/StudentNotifications'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="fees" element={<Fees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="visitors" element={<Visitors />} />
            <Route path="leaves" element={<Leaves />} />
            <Route path="mess" element={<Mess />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="documents" element={<Documents />} />
            <Route path="room-transfers" element={<RoomTransfers />} />
            <Route path="staff" element={<Staff />} />
            <Route path="reports" element={<Reports />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="hostels" element={<Hostels />} />
            <Route path="users" element={<Users />} />
          </Route>

          {/* Student Portal Routes */}
          <Route path="/student/login" element={<StudentLogin />} />
          <Route
            path="/student"
            element={
              <StudentPrivateRoute>
                <StudentLayout />
              </StudentPrivateRoute>
            }
          >
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="profile" element={<StudentProfile />} />
            <Route path="fees" element={<StudentFees />} />
            <Route path="complaints" element={<StudentComplaints />} />
            <Route path="leaves" element={<StudentLeaves />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="room-transfers" element={<StudentRoomTransfers />} />
            <Route path="notifications" element={<StudentNotifications />} />
          </Route>
        </Routes>
      </Router>
      </NotificationProvider>
    </AuthProvider>
    </ThemeProvider>
  )
}

export default App

