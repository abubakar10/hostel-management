import { Text, View, Pressable } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useHostel } from '../context/HostelContext';
import { colors } from '../theme';

function Group({ title, children }) {
  return (
    <View style={{ marginTop: 16 }}>
      <Text
        style={{
          paddingHorizontal: 16,
          marginBottom: 6,
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: colors.muted,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function Item({ navigation, state, name, label, icon }) {
  const active = state.routeNames[state.index] === name;
  return (
    <DrawerItem
      label={label}
      focused={active}
      onPress={() => navigation.navigate(name)}
      icon={({ size }) => <Ionicons name={icon} size={size} color={active ? '#fff' : colors.ink} />}
      labelStyle={{ fontWeight: '600', fontSize: 15, color: active ? '#fff' : colors.ink }}
      style={{ borderRadius: 12, marginHorizontal: 8 }}
      activeBackgroundColor={colors.primary}
      inactiveBackgroundColor="transparent"
    />
  );
}

export function StaffDrawerContent(props) {
  const { user, logout } = useAuth();
  const { isSuperAdmin, hostels, selectedHostelId, setSelectedHostelId, selectedHostel } = useHostel();

  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: colors.cream }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.primaryDark }}>Hostel office</Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>{user?.username || 'Manager'}</Text>
        {selectedHostel ? (
          <Text style={{ color: colors.muted, marginTop: 2 }}>{selectedHostel.name}</Text>
        ) : null}
      </View>

      {isSuperAdmin ? (
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <Text style={{ fontWeight: '700', color: colors.ink, marginBottom: 8 }}>Choose hostel</Text>
          {hostels.map((h) => {
            const on = String(h.id) === String(selectedHostelId);
            return (
              <Pressable
                key={h.id}
                onPress={() => setSelectedHostelId(String(h.id))}
                style={{
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 6,
                  backgroundColor: on ? colors.primary : colors.white,
                  borderWidth: 1,
                  borderColor: on ? colors.primary : colors.line,
                }}
              >
                <Text style={{ fontWeight: '600', color: on ? '#fff' : colors.ink }}>{h.name}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Group title="Start here">
        <Item {...props} name="Home" label="Home" icon="home-outline" />
      </Group>
      <Group title="People and rooms">
        <Item {...props} name="People" label="People" icon="people-outline" />
        <Item {...props} name="Rooms" label="Rooms" icon="bed-outline" />
        <Item {...props} name="Staff" label="Staff" icon="briefcase-outline" />
      </Group>
      <Group title="Daily work">
        <Item {...props} name="Payments" label="Payments" icon="cash-outline" />
        <Item {...props} name="Attendance" label="Attendance" icon="checkbox-outline" />
        <Item {...props} name="Visitors" label="Visitors" icon="walk-outline" />
        <Item {...props} name="Meals" label="Meals" icon="restaurant-outline" />
      </Group>
      <Group title="Requests">
        <Item {...props} name="Leave" label="Leave" icon="calendar-outline" />
        <Item {...props} name="Problems" label="Problems" icon="alert-circle-outline" />
        <Item {...props} name="Repairs" label="Repairs" icon="construct-outline" />
        <Item {...props} name="RoomChange" label="Room change" icon="swap-horizontal-outline" />
      </Group>
      <Group title="Records">
        <Item {...props} name="Stock" label="Stock" icon="cube-outline" />
        <Item {...props} name="Files" label="Files" icon="document-outline" />
        <Item {...props} name="MoneyReport" label="Money report" icon="stats-chart-outline" />
        <Item {...props} name="Alerts" label="Alerts" icon="notifications-outline" />
      </Group>
      {isSuperAdmin ? (
        <Group title="Owner">
          <Item {...props} name="Hostels" label="Hostels" icon="business-outline" />
          <Item {...props} name="Managers" label="Managers" icon="person-add-outline" />
        </Group>
      ) : null}

      <Pressable onPress={logout} style={{ padding: 20, marginTop: 12 }}>
        <Text style={{ color: colors.danger, fontWeight: '700' }}>Sign out</Text>
      </Pressable>
    </DrawerContentScrollView>
  );
}

export function StudentDrawerContent(props) {
  const { user, logout } = useAuth();
  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: colors.cream }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.primaryDark }}>Resident home</Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.student_id || 'Resident'}
        </Text>
      </View>
      <Item {...props} name="Home" label="Home" icon="home-outline" />
      <Item {...props} name="MyDetails" label="My details" icon="person-outline" />
      <Item {...props} name="MyPayments" label="My payments" icon="cash-outline" />
      <Item {...props} name="MyAttendance" label="My attendance" icon="checkbox-outline" />
      <Item {...props} name="MyProblems" label="Problems" icon="alert-circle-outline" />
      <Item {...props} name="MyLeave" label="Leave" icon="calendar-outline" />
      <Item {...props} name="ChangeRoom" label="Change room" icon="swap-horizontal-outline" />
      <Item {...props} name="Alerts" label="Alerts" icon="notifications-outline" />
      <Pressable onPress={logout} style={{ padding: 20, marginTop: 12 }}>
        <Text style={{ color: colors.danger, fontWeight: '700' }}>Sign out</Text>
      </Pressable>
    </DrawerContentScrollView>
  );
}
