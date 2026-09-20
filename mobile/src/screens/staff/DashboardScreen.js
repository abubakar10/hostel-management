import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useHostel } from '../../context/HostelContext';
import { Card, Empty, Loading, Screen, Subtitle, Title } from '../../components/ui';
import { colors } from '../../theme';

const tiles = [
  { key: 'students', label: 'People living here', hint: 'Open the people list', screen: 'People' },
  { key: 'rooms', label: 'Rooms in use', hint: 'Who is in which room', screen: 'Rooms', format: (s) => `${s.occupiedRooms}/${s.totalRooms}` },
  { key: 'occupancyRate', label: 'Beds filled', hint: 'Space still free', screen: 'Rooms', format: (s) => `${s.occupancyRate}%` },
  { key: 'totalFees', label: 'Money collected', hint: 'Paid so far', screen: 'Payments', money: true },
  { key: 'pendingFees', label: 'Still to collect', hint: 'Open payments', screen: 'Payments', money: true },
  { key: 'overdueFees', label: 'Late payments', hint: 'Past the due date', screen: 'Payments', money: true },
  { key: 'complaints', label: 'Open problems', hint: 'Not finished yet', screen: 'Problems' },
  { key: 'maintenance', label: 'Repairs waiting', hint: 'Jobs not started', screen: 'Repairs' },
  { key: 'attendanceRate', label: 'Present today', hint: 'Mark attendance', screen: 'Attendance', format: (s) => `${s.attendanceRate}%` },
];

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { isSuperAdmin, selectedHostelId } = useHostel();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/reports/overview');
      setStats(data);
      setError('');
    } catch (e) {
      setError(e.response?.data?.error || 'Could not load today’s numbers.');
    } finally {
      setLoading(false);
    }
  }, [selectedHostelId]);

  useEffect(() => {
    if (isSuperAdmin && !selectedHostelId) {
      setLoading(false);
      return;
    }
    load();
  }, [isSuperAdmin, selectedHostelId, load]);

  if (isSuperAdmin && !selectedHostelId) {
    return (
      <Screen>
        <Title>Choose a hostel first</Title>
        <Subtitle>You look after more than one hostel. Pick one from the top of the menu.</Subtitle>
      </Screen>
    );
  }

  if (loading && !stats) return <Loading />;

  return (
    <Screen padded={false}>
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Title>Hello, {user?.username || 'there'}</Title>
        <Subtitle>This is today’s picture of the hostel. Tap a box to open that work.</Subtitle>
        {error ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text> : null}

        <Card>
          <Text style={{ fontWeight: '700', marginBottom: 10, color: colors.ink }}>Common jobs</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              ['Add a person', 'People'],
              ['Record a payment', 'Payments'],
              ['Mark who is here', 'Attendance'],
              ['Log a problem', 'Problems'],
            ].map(([label, screen]) => (
              <Pressable
                key={label}
                onPress={() => navigation.navigate(screen)}
                style={{
                  width: '47%',
                  backgroundColor: colors.primarySoft,
                  borderRadius: 14,
                  padding: 14,
                  minHeight: 72,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.primaryDark, fontWeight: '700' }}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {tiles.map((tile) => {
          const value = tile.format
            ? tile.format(stats || {})
            : tile.money
              ? `RS ${Number(stats?.[tile.key] || 0).toLocaleString()}`
              : String(stats?.[tile.key] ?? 0);
          return (
            <Pressable key={tile.label} onPress={() => navigation.navigate(tile.screen)}>
              <Card>
                <Text style={{ color: colors.muted, fontSize: 13 }}>{tile.label}</Text>
                <Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink, marginTop: 4 }}>{value}</Text>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{tile.hint}</Text>
              </Card>
            </Pressable>
          );
        })}
        {!stats?.topPending?.length ? <Empty title="Nobody owes money right now" /> : null}
      </ScrollView>
    </Screen>
  );
}
