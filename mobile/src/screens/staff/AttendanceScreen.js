import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import api from '../../config/api';
import { useHostel } from '../../context/HostelContext';
import { Badge, Card, ChipTabs, Empty, Field, Loading, PrimaryButton, Screen, Subtitle, Title } from '../../components/ui';
import { colors } from '../../theme';

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);

export default function AttendanceScreen() {
  const { isSuperAdmin, selectedHostelId } = useHostel();
  const [view, setView] = useState('daily');
  const [date, setDate] = useState(today());
  const [month, setMonth] = useState(thisMonth());
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (isSuperAdmin && !selectedHostelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const studentsRes = await api.get('/api/students');
      setStudents((studentsRes.data || []).filter((s) => s.status === 'active'));
      if (view === 'daily') {
        const res = await api.get(`/api/attendance/daily/${date}`);
        setAttendance(res.data || []);
      } else {
        const [year, m] = month.split('-');
        const res = await api.get(`/api/attendance/monthly/${year}/${m}`);
        setMonthly(res.data || []);
      }
    } catch (e) {
      Alert.alert('Could not load attendance', e.response?.data?.error || 'Try again');
    } finally {
      setLoading(false);
    }
  }, [view, date, month, isSuperAdmin, selectedHostelId]);

  useEffect(() => {
    load();
  }, [load]);

  const mark = async (studentId, status) => {
    try {
      await api.post('/api/attendance', { student_id: studentId, date, status, remarks: '' });
      load();
    } catch (e) {
      Alert.alert('Could not mark', e.response?.data?.error || 'Try again');
    }
  };

  const markAllPresent = async () => {
    const dateObj = new Date(date);
    const valid = students.filter((s) => !s.created_at || dateObj >= new Date(s.created_at));
    if (!valid.length) {
      Alert.alert('Nobody to mark', 'No residents can be marked for this date.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/attendance/bulk', {
        date,
        records: valid.map((s) => ({ student_id: s.id, status: 'present', remarks: '' })),
      });
      load();
    } catch (e) {
      Alert.alert('Could not mark all', e.response?.data?.error || 'Try again');
    } finally {
      setSaving(false);
    }
  };

  const statusFor = (studentId) => attendance.find((a) => a.student_id === studentId)?.status;

  if (isSuperAdmin && !selectedHostelId) {
    return (
      <Screen>
        <Title>Choose a hostel first</Title>
        <Subtitle>Pick a hostel from the menu, then mark who is here.</Subtitle>
      </Screen>
    );
  }

  if (loading && !students.length) return <Loading />;

  return (
    <Screen padded={false}>
      <View style={{ padding: 16 }}>
        <Title>Attendance</Title>
        <Subtitle>Mark who is present, late, or away today.</Subtitle>
        <ChipTabs
          value={view}
          onChange={setView}
          options={[
            { value: 'daily', label: 'Today' },
            { value: 'monthly', label: 'This month' },
          ]}
        />
        {view === 'daily' ? (
          <>
            <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
            <PrimaryButton title={saving ? 'Marking…' : 'Mark everyone present'} onPress={markAllPresent} loading={saving} />
          </>
        ) : (
          <Field label="Month (YYYY-MM)" value={month} onChangeText={setMonth} />
        )}
      </View>
      {view === 'daily' ? (
        <FlatList
          data={students}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          ListEmptyComponent={<Empty title="No residents yet" />}
          renderItem={({ item }) => {
            const status = statusFor(item.id);
            return (
              <Card>
                <Text style={{ fontWeight: '700', color: colors.ink }}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={{ color: colors.muted, marginTop: 4 }}>{item.student_id} · Room {item.room_number || 'none'}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {['present', 'late', 'absent'].map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => mark(item.id, s)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: status === s ? colors.primary : colors.white,
                        borderWidth: 1,
                        borderColor: status === s ? colors.primary : colors.line,
                      }}
                    >
                      <Text style={{ color: status === s ? '#fff' : colors.ink, fontWeight: '700', textTransform: 'capitalize' }}>{s}</Text>
                    </Pressable>
                  ))}
                </View>
              </Card>
            );
          }}
        />
      ) : (
        <FlatList
          data={monthly}
          keyExtractor={(item, i) => String(item.student_id || item.id || i)}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          ListEmptyComponent={<Empty title="No monthly report yet" />}
          renderItem={({ item }) => (
            <Card>
              <Text style={{ fontWeight: '700', color: colors.ink }}>
                {item.first_name} {item.last_name}
              </Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                Present {item.present_days || item.present || 0} · Absent {item.absent_days || item.absent || 0} · Late {item.late_days || item.late || 0}
              </Text>
              <View style={{ marginTop: 8 }}>
                <Badge
                  text={`${
                    item.total_days
                      ? Math.round((Number(item.present_days || 0) / Number(item.total_days)) * 100)
                      : 0
                  }% present`}
                  tone="primary"
                />
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
