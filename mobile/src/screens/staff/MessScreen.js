import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import api from '../../config/api';
import { useHostel } from '../../context/HostelContext';
import {
  Badge,
  Card,
  ChipTabs,
  Empty,
  Field,
  FormModal,
  Loading,
  PrimaryButton,
  Screen,
  SecondaryButton,
  SelectField,
  Subtitle,
  Title,
} from '../../components/ui';
import { colors } from '../../theme';

const today = () => new Date().toISOString().slice(0, 10);

export default function MessScreen() {
  const { isSuperAdmin, selectedHostelId } = useHostel();
  const [tab, setTab] = useState('menu');
  const [date, setDate] = useState(today());
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ date: today(), meal_type: 'breakfast', menu_items: '', records: [] });

  const load = useCallback(async () => {
    if (isSuperAdmin && !selectedHostelId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (tab === 'menu') {
        const res = await api.get('/api/mess/menu', { params: { date } });
        setRows(res.data || []);
      } else if (tab === 'attendance') {
        const [att, people] = await Promise.all([
          api.get('/api/mess/attendance', { params: { date } }),
          api.get('/api/students'),
        ]);
        setRows(att.data || []);
        setStudents((people.data || []).filter((s) => s.status === 'active'));
      } else {
        const res = await api.get('/api/mess/fees');
        setRows(res.data || []);
      }
    } catch (e) {
      Alert.alert('Could not load meals', e.response?.data?.error || 'Try again');
    } finally {
      setLoading(false);
    }
  }, [tab, date, isSuperAdmin, selectedHostelId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveMenu = async () => {
    setSaving(true);
    try {
      const menu_items = String(form.menu_items)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await api.post('/api/mess/menu', { date: form.date, meal_type: form.meal_type, menu_items });
      setModal(false);
      load();
    } catch (e) {
      Alert.alert('Could not save menu', e.response?.data?.error || 'Try again');
    } finally {
      setSaving(false);
    }
  };

  const saveAttendance = async () => {
    if (!form.records.length) {
      Alert.alert('Pick people', 'Tap residents who ate this meal.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/mess/attendance/bulk', {
        date: form.date,
        meal_type: form.meal_type,
        records: form.records,
      });
      setModal(false);
      load();
    } catch (e) {
      Alert.alert('Could not save', e.response?.data?.error || 'Try again');
    } finally {
      setSaving(false);
    }
  };

  const toggleStudent = (id) => {
    setForm((prev) => {
      const exists = prev.records.find((r) => r.student_id === id);
      return {
        ...prev,
        records: exists
          ? prev.records.filter((r) => r.student_id !== id)
          : [...prev.records, { student_id: id, status: 'present' }],
      };
    });
  };

  if (isSuperAdmin && !selectedHostelId) {
    return (
      <Screen>
        <Title>Choose a hostel first</Title>
        <Subtitle>Pick a hostel from the menu, then meals will appear.</Subtitle>
      </Screen>
    );
  }

  if (loading && !rows.length) return <Loading />;

  return (
    <Screen padded={false}>
      <View style={{ padding: 16 }}>
        <Title>Meals</Title>
        <Subtitle>Today’s food, who ate, and kitchen bills.</Subtitle>
        <ChipTabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'menu', label: 'Menu' },
            { value: 'attendance', label: 'Who ate' },
            { value: 'fees', label: 'Kitchen bills' },
          ]}
        />
        {tab !== 'fees' ? <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} /> : null}
        {tab === 'menu' ? (
          <PrimaryButton
            title="Add menu"
            onPress={() => {
              setForm({ date, meal_type: 'breakfast', menu_items: '', records: [] });
              setModal(true);
            }}
          />
        ) : null}
        {tab === 'attendance' ? (
          <PrimaryButton
            title="Mark who ate"
            onPress={() => {
              setForm({ date, meal_type: 'breakfast', menu_items: '', records: [] });
              setModal(true);
            }}
          />
        ) : null}
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item, i) => String(item.id || i)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ListEmptyComponent={<Empty title="Nothing here yet" />}
        renderItem={({ item }) => (
          <Card>
            {tab === 'menu' ? (
              <>
                <Text style={{ fontWeight: '700', color: colors.ink, textTransform: 'capitalize' }}>{item.meal_type}</Text>
                <Text style={{ color: colors.muted, marginTop: 4 }}>
                  {Array.isArray(item.menu_items) ? item.menu_items.join(', ') : item.menu_items}
                </Text>
              </>
            ) : null}
            {tab === 'attendance' ? (
              <>
                <Text style={{ fontWeight: '700', color: colors.ink }}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={{ color: colors.muted, marginTop: 4, textTransform: 'capitalize' }}>
                  {item.meal_type} · {item.status}
                </Text>
              </>
            ) : null}
            {tab === 'fees' ? (
              <>
                <Text style={{ fontWeight: '700', color: colors.ink }}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={{ color: colors.muted, marginTop: 4 }}>RS {item.amount}</Text>
                <View style={{ marginTop: 8 }}>
                  <Badge text={item.status} tone={item.status === 'paid' ? 'success' : 'warning'} />
                </View>
                {item.status !== 'paid' ? (
                  <View style={{ marginTop: 10 }}>
                    <SecondaryButton
                      title="Mark paid"
                      onPress={async () => {
                        try {
                          await api.put(`/api/mess/fees/${item.id}`, {
                            status: 'paid',
                            paid_date: today(),
                          });
                          load();
                        } catch (e) {
                          Alert.alert('Could not mark paid', e.response?.data?.error || 'Try again');
                        }
                      }}
                    />
                  </View>
                ) : null}
              </>
            ) : null}
          </Card>
        )}
      />
      <FormModal
        visible={modal}
        title={tab === 'menu' ? 'Add menu' : 'Who ate'}
        onClose={() => setModal(false)}
        onSave={tab === 'menu' ? saveMenu : saveAttendance}
        saving={saving}
      >
        <Field label="Date (YYYY-MM-DD)" value={form.date} onChangeText={(v) => setForm((s) => ({ ...s, date: v }))} />
        <SelectField
          label="Meal"
          value={form.meal_type}
          options={['breakfast', 'lunch', 'dinner']}
          onChange={(v) => setForm((s) => ({ ...s, meal_type: v }))}
        />
        {tab === 'menu' ? (
          <Field
            label="Food items (comma separated)"
            value={form.menu_items}
            multiline
            onChangeText={(v) => setForm((s) => ({ ...s, menu_items: v }))}
          />
        ) : (
          students.map((s) => {
            const on = form.records.some((r) => r.student_id === s.id);
            return (
              <SecondaryButton
                key={s.id}
                title={`${on ? '✓ ' : ''}${s.first_name} ${s.last_name}`}
                onPress={() => toggleStudent(s.id)}
              />
            );
          })
        )}
      </FormModal>
    </Screen>
  );
}
