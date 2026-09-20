import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/ui';
import { colors } from '../theme';
import { StaffDrawerContent, StudentDrawerContent } from './DrawerContent';

import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import DashboardScreen from '../screens/staff/DashboardScreen';
import AttendanceScreen from '../screens/staff/AttendanceScreen';
import MessScreen from '../screens/staff/MessScreen';
import ReportsScreen from '../screens/staff/ReportsScreen';
import NotificationsScreen from '../screens/staff/NotificationsScreen';
import {
  PeopleScreen,
  RoomsScreen,
  PaymentsScreen,
  StaffScreen,
  VisitorsScreen,
  LeavesScreen,
  ProblemsScreen,
  RepairsScreen,
  RoomChangeScreen,
  StockScreen,
  FilesScreen,
  HostelsScreen,
  ManagersScreen,
} from '../screens/staff/StaffResources';
import {
  StudentHomeScreen,
  StudentDetailsScreen,
  StudentPaymentsScreen,
  StudentAttendanceScreen,
  StudentProblemsScreen,
  StudentLeaveScreen,
  StudentRoomChangeScreen,
  StudentAlertsScreen,
} from '../screens/student/StudentScreens';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const header = {
  headerStyle: { backgroundColor: colors.white },
  headerTintColor: colors.ink,
  headerTitleStyle: { fontWeight: '700' },
  sceneContainerStyle: { backgroundColor: colors.cream },
  drawerStyle: { backgroundColor: colors.cream, width: 300 },
};

function StaffDrawer() {
  const { user } = useAuth();
  const superAdmin = user?.role === 'super_admin';
  return (
    <Drawer.Navigator
      drawerContent={(props) => <StaffDrawerContent {...props} />}
      screenOptions={header}
    >
      <Drawer.Screen name="Home" component={DashboardScreen} options={{ title: 'Home' }} />
      <Drawer.Screen name="People" component={PeopleScreen} />
      <Drawer.Screen name="Rooms" component={RoomsScreen} />
      <Drawer.Screen name="Staff" component={StaffScreen} />
      <Drawer.Screen name="Payments" component={PaymentsScreen} />
      <Drawer.Screen name="Attendance" component={AttendanceScreen} />
      <Drawer.Screen name="Visitors" component={VisitorsScreen} />
      <Drawer.Screen name="Meals" component={MessScreen} />
      <Drawer.Screen name="Leave" component={LeavesScreen} />
      <Drawer.Screen name="Problems" component={ProblemsScreen} />
      <Drawer.Screen name="Repairs" component={RepairsScreen} />
      <Drawer.Screen name="RoomChange" component={RoomChangeScreen} options={{ title: 'Room change' }} />
      <Drawer.Screen name="Stock" component={StockScreen} />
      <Drawer.Screen name="Files" component={FilesScreen} />
      <Drawer.Screen name="MoneyReport" component={ReportsScreen} options={{ title: 'Money report' }} />
      <Drawer.Screen name="Alerts" component={NotificationsScreen} />
      {superAdmin ? (
        <>
          <Drawer.Screen name="Hostels" component={HostelsScreen} />
          <Drawer.Screen name="Managers" component={ManagersScreen} />
        </>
      ) : null}
    </Drawer.Navigator>
  );
}

function StudentDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <StudentDrawerContent {...props} />}
      screenOptions={header}
    >
      <Drawer.Screen name="Home" component={StudentHomeScreen} />
      <Drawer.Screen name="MyDetails" component={StudentDetailsScreen} options={{ title: 'My details' }} />
      <Drawer.Screen name="MyPayments" component={StudentPaymentsScreen} options={{ title: 'My payments' }} />
      <Drawer.Screen name="MyAttendance" component={StudentAttendanceScreen} options={{ title: 'My attendance' }} />
      <Drawer.Screen name="MyProblems" component={StudentProblemsScreen} options={{ title: 'Problems' }} />
      <Drawer.Screen name="MyLeave" component={StudentLeaveScreen} options={{ title: 'Leave' }} />
      <Drawer.Screen name="ChangeRoom" component={StudentRoomChangeScreen} options={{ title: 'Change room' }} />
      <Drawer.Screen name="Alerts" component={StudentAlertsScreen} />
    </Drawer.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return (
    <NavigationContainer>
      {!user ? <AuthStack /> : user.role === 'student' ? <StudentDrawer /> : <StaffDrawer />}
    </NavigationContainer>
  );
}
