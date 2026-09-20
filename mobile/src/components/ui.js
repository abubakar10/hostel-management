import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

export function Screen({ children, padded = true }) {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={[styles.screen, padded && styles.padded]}>{children}</View>
    </SafeAreaView>
  );
}

export function Title({ children }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({ title, onPress, disabled, loading }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.primaryBtn, (disabled || loading) && styles.disabled]}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{title}</Text>}
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress, danger }) {
  return (
    <Pressable onPress={onPress} style={[styles.secondaryBtn, danger && styles.dangerBtn]}>
      <Text style={[styles.secondaryBtnText, danger && styles.dangerText]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, placeholder, secure, keyboardType, multiline }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value == null ? '' : String(value)}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[styles.input, multiline && styles.textarea]}
      />
    </View>
  );
}

export function SelectField({ label, value, options, onChange }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {options.map((opt) => {
          const v = typeof opt === 'string' ? opt : opt.value;
          const l = typeof opt === 'string' ? opt : opt.label;
          const active = String(value) === String(v);
          return (
            <Pressable
              key={String(v)}
              onPress={() => onChange(v)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{l}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function ChipTabs({ value, options, onChange }) {
  return (
    <View style={styles.chipsWrap}>
      {options.map((opt) => {
        const v = typeof opt === 'string' ? opt : opt.value;
        const l = typeof opt === 'string' ? opt : opt.label;
        const active = String(value) === String(v);
        return (
          <Pressable key={String(v)} onPress={() => onChange(v)} style={[styles.chip, active && styles.chipActive]}>
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Badge({ text, tone = 'muted' }) {
  const map = {
    muted: { bg: '#e2e8f0', fg: colors.ink },
    success: { bg: '#d1fae5', fg: colors.success },
    warning: { bg: '#fef3c7', fg: colors.warning },
    danger: { bg: '#fee2e2', fg: colors.danger },
    primary: { bg: colors.primarySoft, fg: colors.primary },
  };
  const t = map[tone] || map.muted;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{text}</Text>
    </View>
  );
}

export function Empty({ title, hint }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {hint ? <Text style={styles.emptyHint}>{hint}</Text> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function FormModal({ visible, title, children, onClose, onSave, saving }) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalWrap}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
          <View style={styles.modalActions}>
            <SecondaryButton title="Cancel" onPress={onClose} />
            <PrimaryButton title={saving ? 'Saving…' : 'Save'} onPress={onSave} loading={saving} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function confirmDelete(onYes) {
  Alert.alert('Remove this record?', 'This cannot be undone.', [
    { text: 'Keep it', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: onYes },
  ]);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  screen: { flex: 1, backgroundColor: colors.cream },
  padded: { padding: spacing.md },
  title: { fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.muted, marginBottom: spacing.md, lineHeight: 22 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: {
    backgroundColor: colors.white,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.line,
  },
  secondaryBtnText: { color: colors.ink, fontWeight: '600', fontSize: 15 },
  dangerBtn: { borderColor: '#fecaca' },
  dangerText: { color: colors.danger },
  disabled: { opacity: 0.6 },
  field: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  textarea: { minHeight: 90, textAlignVertical: 'top' },
  chips: { gap: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.ink, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  empty: { paddingVertical: 40, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  emptyHint: { fontSize: 14, color: colors.muted, marginTop: 4, textAlign: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.md,
    maxHeight: '88%',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: colors.ink },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 },
});
