import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import {
  Badge,
  Card,
  Empty,
  Field,
  FormModal,
  Loading,
  PrimaryButton,
  Screen,
  SelectField,
  Subtitle,
  Title,
} from '../../components/ui';
import { colors } from '../../theme';

function ListScreen({ title, subtitle, load, rows, loading, renderItem, header, emptyTitle }) {
  return (
    <Screen padded={false}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
        {header}
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item, i) => String(item.id || i)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ListEmptyComponent={<Empty title={emptyTitle || 'Nothing here yet'} />}
        renderItem={renderItem}
      />
    </Screen>
  );
}

export function StudentHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [feesRes, attendanceRes, complaintsRes, leavesRes, profileRes] = await Promise.all([
        api.get('/api/student/fees'),
        api.get('/api/student/attendance'),
        api.get('/api/student/complaints'),
        api.get('/api/student/leaves'),
        api.get('/api/student/profile'),
      ]);
      const fees = feesRes.data || [];
      const attendance = attendanceRes.data || [];
      const present = attendance.filter((a) => a.status === 'present').length;
      setProfile(profileRes.data);
      setStats({
        pending: fees.filter((f) => f.status === 'pending' || f.status === 'overdue').reduce((s, f) => s + Number(f.amount || 0), 0),
        rate: attendance.length ? Math.round((present / attendance.length) * 100) : 0,
        complaints: (complaintsRes.data || []).filter((c) => c.status === 'open' || c.status === 'in_progress').length,
        leaves: (leavesRes.data || []).filter((l) => l.status === 'pending').length,
      });
    } catch (e) {
      Alert.alert('Could not load home', e.response?.data?.error || 'Try again');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !stats) return <Loading />;

  const cards = [
    { label: 'Still to pay', value: `RS ${Number(stats?.pending || 0).toLocaleString()}`, hint: 'Pay at the hostel office', screen: 'MyPayments' },
    { label: 'Days you were present', value: `${stats?.rate || 0}%`, hint: 'Your attendance so far', screen: 'MyAttendance' },
    { label: 'Open problems', value: String(stats?.complaints || 0), hint: 'Things you reported', screen: 'MyProblems' },
    { label: 'Leave waiting', value: String(stats?.leaves || 0), hint: 'Requests not decided yet', screen: 'MyLeave' },
  ];

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <Title>Hello, {profile?.first_name || user?.first_name || 'there'}</Title>
        <Subtitle>
          {profile?.hostel_name ? `${profile.hostel_name} · Room ${profile.room_number || 'not assigned'}` : 'Your hostel home.'}
        </Subtitle>
        {cards.map((c) => (
          <Pressable key={c.label} onPress={() => navigation.navigate(c.screen)}>
            <Card>
              <Text style={{ color: colors.muted }}>{c.label}</Text>
              <Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink, marginTop: 4 }}>{c.value}</Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>{c.hint}</Text>
            </Card>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

export function StudentDetailsScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/student/profile');
      setProfile(res.data);
    } catch (e) {
      Alert.alert('Could not load details', e.response?.data?.error || 'Try again');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !profile) return <Loading />;
  if (!profile) {
    return (
      <Screen>
        <Empty title="Details not found" />
      </Screen>
    );
  }

  const rows = [
    ['Student ID', profile.student_id],
    ['Email', profile.email],
    ['Phone', profile.phone],
    ['Course', profile.course],
    ['Year', profile.year_of_study],
    ['Room', profile.room_number],
    ['Hostel', profile.hostel_name],
    ['Address', profile.address],
  ];

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ padding: 16 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <Title>My details</Title>
        <Subtitle>If something is wrong, ask the hostel office to update it.</Subtitle>
        <Card>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>
            {profile.first_name} {profile.last_name}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{profile.student_id}</Text>
        </Card>
        {rows.map(([label, value]) => (
          <Card key={label}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
            <Text style={{ fontWeight: '600', color: colors.ink, marginTop: 4 }}>{value || '—'}</Text>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}

export function StudentPaymentsScreen() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/student/fees');
      setRows(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = rows.filter((f) => f.status === 'pending' || f.status === 'overdue').reduce((s, f) => s + Number(f.amount || 0), 0);
  const paid = rows.filter((f) => f.status === 'paid').reduce((s, f) => s + Number(f.amount || 0), 0);

  return (
    <ListScreen
      title="My payments"
      subtitle="Pay at the office. The manager marks it here when received."
      load={load}
      rows={rows}
      loading={loading}
      header={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Card style={{ flex: 1 }}>
            <Text style={{ color: colors.muted }}>Still to pay</Text>
            <Text style={{ fontWeight: '700', fontSize: 18 }}>RS {pending.toLocaleString()}</Text>
          </Card>
          <Card style={{ flex: 1 }}>
            <Text style={{ color: colors.muted }}>Paid</Text>
            <Text style={{ fontWeight: '700', fontSize: 18, color: colors.success }}>RS {paid.toLocaleString()}</Text>
          </Card>
        </View>
      }
      renderItem={({ item }) => (
        <Card>
          <Text style={{ fontWeight: '700', color: colors.ink, textTransform: 'capitalize' }}>{item.fee_type}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>RS {item.amount} · due {String(item.due_date || '').slice(0, 10)}</Text>
          <View style={{ marginTop: 8 }}>
            <Badge text={item.status} tone={item.status === 'paid' ? 'success' : item.status === 'overdue' ? 'danger' : 'warning'} />
          </View>
        </Card>
      )}
    />
  );
}

export function StudentAttendanceScreen() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/student/attendance');
      setRows(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const present = rows.filter((a) => a.status === 'present').length;
  const rate = rows.length ? Math.round((present / rows.length) * 100) : 0;

  return (
    <ListScreen
      title="My attendance"
      subtitle="Days you were marked present, late, or away."
      load={load}
      rows={rows}
      loading={loading}
      header={
        <Card>
          <Text style={{ color: colors.muted }}>Present so far</Text>
          <Text style={{ fontSize: 22, fontWeight: '700' }}>{rate}%</Text>
        </Card>
      }
      renderItem={({ item }) => (
        <Card>
          <Text style={{ fontWeight: '700' }}>{String(item.date || '').slice(0, 10)}</Text>
          <View style={{ marginTop: 8 }}>
            <Badge
              text={item.status}
              tone={item.status === 'present' ? 'success' : item.status === 'late' ? 'warning' : 'danger'}
            />
          </View>
        </Card>
      )}
    />
  );
}

export function StudentProblemsScreen() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'other', priority: 'medium' });

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/student/complaints');
      setRows(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      Alert.alert('Missing details', 'Please write a title and what happened.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/student/complaints', form);
      setModal(false);
      setForm({ title: '', description: '', category: 'other', priority: 'medium' });
      load();
    } catch (e) {
      Alert.alert('Could not send', e.response?.data?.error || 'Try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ListScreen
        title="Problems I reported"
        subtitle="Tell the office if something is broken or unclean."
        load={load}
        rows={rows}
        loading={loading}
        header={<PrimaryButton title="Report a problem" onPress={() => setModal(true)} />}
        renderItem={({ item }) => (
          <Card>
            <Text style={{ fontWeight: '700' }}>{item.title}</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>{item.description}</Text>
            <View style={{ marginTop: 8 }}>
              <Badge text={item.status} tone={item.status === 'resolved' || item.status === 'closed' ? 'success' : 'warning'} />
            </View>
          </Card>
        )}
      />
      <FormModal visible={modal} title="Report a problem" onClose={() => setModal(false)} onSave={save} saving={saving}>
        <Field label="Title" value={form.title} onChangeText={(v) => setForm((s) => ({ ...s, title: v }))} />
        <Field label="What happened" multiline value={form.description} onChangeText={(v) => setForm((s) => ({ ...s, description: v }))} />
        <SelectField
          label="Category"
          value={form.category}
          options={['maintenance', 'cleanliness', 'security', 'other']}
          onChange={(v) => setForm((s) => ({ ...s, category: v }))}
        />
        <SelectField
          label="How urgent"
          value={form.priority}
          options={['low', 'medium', 'high']}
          onChange={(v) => setForm((s) => ({ ...s, priority: v }))}
        />
      </FormModal>
    </>
  );
}

export function StudentLeaveScreen() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ leave_type: 'vacation', start_date: '', end_date: '', reason: '', emergency_contact: '' });

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/student/leaves');
      setRows(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.start_date || !form.end_date || !form.reason.trim()) {
      Alert.alert('Missing details', 'Please fill dates and a reason.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/student/leaves', form);
      setModal(false);
      setForm({ leave_type: 'vacation', start_date: '', end_date: '', reason: '', emergency_contact: '' });
      load();
    } catch (e) {
      Alert.alert('Could not send', e.response?.data?.error || 'Try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ListScreen
        title="My leave"
        subtitle="Ask to go home. You can see if it is approved here."
        load={load}
        rows={rows}
        loading={loading}
        header={<PrimaryButton title="Ask for leave" onPress={() => setModal(true)} />}
        renderItem={({ item }) => (
          <Card>
            <Text style={{ fontWeight: '700', textTransform: 'capitalize' }}>{item.leave_type}</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>
              {String(item.start_date || '').slice(0, 10)} to {String(item.end_date || '').slice(0, 10)}
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>{item.reason}</Text>
            <View style={{ marginTop: 8 }}>
              <Badge
                text={item.status}
                tone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}
              />
            </View>
          </Card>
        )}
      />
      <FormModal visible={modal} title="Ask for leave" onClose={() => setModal(false)} onSave={save} saving={saving}>
        <SelectField
          label="Type"
          value={form.leave_type}
          options={['vacation', 'emergency', 'weekend']}
          onChange={(v) => setForm((s) => ({ ...s, leave_type: v }))}
        />
        <Field label="Start date (YYYY-MM-DD)" value={form.start_date} onChangeText={(v) => setForm((s) => ({ ...s, start_date: v }))} />
        <Field label="End date (YYYY-MM-DD)" value={form.end_date} onChangeText={(v) => setForm((s) => ({ ...s, end_date: v }))} />
        <Field label="Reason" multiline value={form.reason} onChangeText={(v) => setForm((s) => ({ ...s, reason: v }))} />
        <Field label="Emergency contact" value={form.emergency_contact} onChangeText={(v) => setForm((s) => ({ ...s, emergency_contact: v }))} />
      </FormModal>
    </>
  );
}

export function StudentRoomChangeScreen() {
  const [rows, setRows] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ to_room_id: '', reason: '' });

  const load = useCallback(async () => {
    try {
      const [transfers, available, me] = await Promise.all([
        api.get('/api/student/room-transfers'),
        api.get('/api/student/rooms/available'),
        api.get('/api/student/profile'),
      ]);
      setRows(transfers.data || []);
      setRooms(available.data || []);
      setProfile(me.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!profile?.room_id) {
      Alert.alert('No room yet', 'Ask the office to assign you a room first.');
      return;
    }
    if (!form.to_room_id || !form.reason.trim()) {
      Alert.alert('Missing details', 'Pick a room and write a reason.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/student/room-transfers', form);
      setModal(false);
      setForm({ to_room_id: '', reason: '' });
      load();
    } catch (e) {
      Alert.alert('Could not send', e.response?.data?.error || 'Try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ListScreen
        title="Change room"
        subtitle={`You are in room ${profile?.room_number || 'none'}. Ask to move if you need a different one.`}
        load={load}
        rows={rows}
        loading={loading}
        header={<PrimaryButton title="Ask to change room" onPress={() => setModal(true)} />}
        renderItem={({ item }) => (
          <Card>
            <Text style={{ fontWeight: '700' }}>
              {item.from_room || 'Current'} → {item.to_room || item.to_room_id}
            </Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>{item.reason}</Text>
            <View style={{ marginTop: 8 }}>
              <Badge
                text={item.status}
                tone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}
              />
            </View>
          </Card>
        )}
      />
      <FormModal visible={modal} title="Ask to change room" onClose={() => setModal(false)} onSave={save} saving={saving}>
        <SelectField
          label="New room"
          value={form.to_room_id}
          options={rooms.map((r) => ({ value: String(r.id), label: `Room ${r.room_number}` }))}
          onChange={(v) => setForm((s) => ({ ...s, to_room_id: v }))}
        />
        <Field label="Reason" multiline value={form.reason} onChangeText={(v) => setForm((s) => ({ ...s, reason: v }))} />
      </FormModal>
    </>
  );
}

export function StudentAlertsScreen() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/student/notifications');
      setRows(res.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <ListScreen
      title="Alerts"
      subtitle="Fee reminders, leave decisions, and hostel messages."
      load={load}
      rows={rows}
      loading={loading}
      emptyTitle="No messages yet"
      renderItem={({ item }) => (
        <Card>
          <Text style={{ fontWeight: '700' }}>{item.title}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{item.message}</Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
            {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
          </Text>
        </Card>
      )}
    />
  );
}
