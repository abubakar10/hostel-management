import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import api from '../config/api';
import { colors } from '../theme';
import {
  Badge,
  Card,
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
  confirmDelete,
} from './ui';
import { useHostel } from '../context/HostelContext';

export default function ResourceScreen({
  title,
  subtitle,
  endpoint,
  listEndpoint,
  createEndpoint,
  itemPath,
  searchPlaceholder = 'Search',
  searchKeys = ['name'],
  fields = [],
  createLabel = 'Add',
  itemTitle,
  itemSubtitle,
  itemBadge,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  extraItemActions,
  transformCreate,
  transformUpdate,
  listParams,
}) {
  const listPath = listEndpoint || endpoint;
  const createPath = createEndpoint || endpoint;
  const pathFor = itemPath || ((id) => `${endpoint}/${id}`);
  const { selectedHostelId, isSuperAdmin } = useHostel();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const blank = () =>
    fields.reduce((acc, f) => {
      acc[f.key] = f.defaultValue ?? '';
      return acc;
    }, {});

  const load = useCallback(async () => {
    try {
      const res = await api.get(listPath, { params: listParams });
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      Alert.alert('Could not load', e.response?.data?.error || 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [listPath, JSON.stringify(listParams), selectedHostelId]);

  useEffect(() => {
    if (isSuperAdmin && !selectedHostelId && !['/api/hostels', '/api/users'].includes(endpoint)) {
      setLoading(false);
      return;
    }
    load();
  }, [load, isSuperAdmin, selectedHostelId, endpoint]);

  const filtered = rows.filter((row) => {
    const hay = searchKeys.map((k) => String(row[k] ?? '')).join(' ').toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  const openCreate = () => {
    setEditing(null);
    setForm(blank());
    setModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    const next = blank();
    fields.forEach((f) => {
      next[f.key] = row[f.key] ?? f.defaultValue ?? '';
    });
    setForm(next);
    setModal(true);
  };

  const save = async () => {
    const missing = fields.find((f) => f.required && !String(form[f.key] || '').trim());
    if (missing) {
      Alert.alert('Missing details', `Please fill in ${missing.label}.`);
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const body = transformUpdate ? transformUpdate(form, editing) : form;
        await api.put(pathFor(editing.id), body);
      } else {
        const body = transformCreate ? transformCreate(form) : form;
        await api.post(createPath, body);
      }
      setModal(false);
      load();
    } catch (e) {
      Alert.alert('Could not save', e.response?.data?.error || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const remove = (row) => {
    confirmDelete(async () => {
      try {
        await api.delete(pathFor(row.id));
        load();
      } catch (e) {
        Alert.alert('Could not remove', e.response?.data?.error || 'Please try again.');
      }
    });
  };

  if (isSuperAdmin && !selectedHostelId && !['/api/hostels', '/api/users'].includes(endpoint)) {
    return (
      <Screen>
        <Title>Choose a hostel first</Title>
        <Subtitle>Pick a hostel from the menu at the top, then this list will appear.</Subtitle>
      </Screen>
    );
  }

  if (loading) return <Loading />;

  return (
    <Screen padded={false}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
        <Field placeholder={searchPlaceholder} value={query} onChangeText={setQuery} />
        {canCreate ? <PrimaryButton title={createLabel} onPress={openCreate} /> : null}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        ListEmptyComponent={<Empty title="Nothing here yet" hint="Add a record to get started." />}
        renderItem={({ item }) => (
          <Card>
            <Pressable onPress={() => (canEdit ? openEdit(item) : null)}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>
                {itemTitle ? itemTitle(item) : item.name || `#${item.id}`}
              </Text>
              {itemSubtitle ? (
                <Text style={{ color: colors.muted, marginTop: 4 }}>{itemSubtitle(item)}</Text>
              ) : null}
              {itemBadge ? (
                <View style={{ marginTop: 8 }}>
                  <Badge {...itemBadge(item)} />
                </View>
              ) : null}
            </Pressable>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {canEdit ? <SecondaryButton title="Edit" onPress={() => openEdit(item)} /> : null}
              {canDelete ? <SecondaryButton title="Remove" danger onPress={() => remove(item)} /> : null}
              {extraItemActions ? extraItemActions(item, load) : null}
            </View>
          </Card>
        )}
      />
      <FormModal
        visible={modal}
        title={editing ? 'Edit' : createLabel}
        onClose={() => setModal(false)}
        onSave={save}
        saving={saving}
      >
        {fields.map((f) =>
          f.type === 'select' ? (
            <SelectField
              key={f.key}
              label={f.label}
              value={form[f.key]}
              options={typeof f.options === 'function' ? f.options() : f.options}
              onChange={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
            />
          ) : (
            <Field
              key={f.key}
              label={f.label}
              value={form[f.key]}
              placeholder={f.placeholder}
              keyboardType={f.keyboardType}
              multiline={f.multiline}
              onChangeText={(v) => setForm((s) => ({ ...s, [f.key]: v }))}
            />
          )
        )}
      </FormModal>
    </Screen>
  );
}
