import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import api from '../../config/api';
import { Badge, Card, ChipTabs, Empty, Loading, Screen, SecondaryButton, Subtitle, Title } from '../../components/ui';
import { colors } from '../../theme';

export default function NotificationsScreen() {
  const [filter, setFilter] = useState('all');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const params = filter === 'all' ? {} : { is_read: filter === 'read' ? 'true' : 'false' };
      const res = await api.get('/api/notifications', { params });
      setRows(res.data || []);
    } catch (e) {
      Alert.alert('Could not load alerts', e.response?.data?.error || 'Try again');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      load();
    } catch (e) {
      Alert.alert('Could not update', e.response?.data?.error || 'Try again');
    }
  };

  const markAll = async () => {
    try {
      await api.put('/api/notifications/read-all');
      load();
    } catch (e) {
      Alert.alert('Could not update', e.response?.data?.error || 'Try again');
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      load();
    } catch (e) {
      Alert.alert('Could not remove', e.response?.data?.error || 'Try again');
    }
  };

  if (loading && !rows.length) return <Loading />;

  return (
    <Screen padded={false}>
      <View style={{ padding: 16 }}>
        <Title>Alerts</Title>
        <Subtitle>Reminders and messages for this hostel.</Subtitle>
        <ChipTabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
            { value: 'read', label: 'Read' },
          ]}
        />
        <SecondaryButton title="Mark all read" onPress={markAll} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ListEmptyComponent={<Empty title="No alerts" hint="You are all caught up." />}
        renderItem={({ item }) => (
          <Card style={item.is_read ? { opacity: 0.75 } : null}>
            <Text style={{ fontWeight: '700', color: colors.ink }}>{item.title}</Text>
            <Text style={{ color: colors.muted, marginTop: 4 }}>{item.message}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {item.related_module ? <Badge text={item.related_module} tone="primary" /> : null}
              <Badge text={item.type || 'info'} />
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
              {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {!item.is_read ? <SecondaryButton title="Mark read" onPress={() => markRead(item.id)} /> : null}
              <SecondaryButton title="Remove" danger onPress={() => remove(item.id)} />
            </View>
          </Card>
        )}
      />
    </Screen>
  );
}
