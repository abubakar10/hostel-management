import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Field, PrimaryButton } from '../../components/ui';
import { colors } from '../../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [role, setRole] = useState('staff');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError('');
    setLoading(true);
    const result = await login(username.trim(), password, role === 'resident' ? 'student' : 'admin');
    setLoading(false);
    if (!result.success) setError(result.error);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <View style={styles.card}>
          <Text style={styles.brand}>Hostel office</Text>
          <Text style={styles.lead}>Sign in to check fees, rooms, and daily work.</Text>

          <View style={styles.tabs}>
            <Pressable onPress={() => setRole('resident')} style={[styles.tab, role === 'resident' && styles.tabOn]}>
              <Text style={[styles.tabText, role === 'resident' && styles.tabTextOn]}>I live here</Text>
            </Pressable>
            <Pressable onPress={() => setRole('staff')} style={[styles.tab, role === 'staff' && styles.tabOn]}>
              <Text style={[styles.tabText, role === 'staff' && styles.tabTextOn]}>I run the hostel</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Field
            label={role === 'resident' ? 'Your ID or email' : 'Your username or email'}
            value={username}
            onChangeText={setUsername}
            placeholder={role === 'resident' ? 'e.g. STU-101' : 'e.g. office'}
          />
          <Field label="Password" value={password} onChangeText={setPassword} secure placeholder="Enter your password" />
          {role === 'resident' ? (
            <Text style={styles.hint}>First time? Use your student ID as the password, then change it from Forgot password.</Text>
          ) : null}

          <PrimaryButton title={loading ? 'Signing you in…' : 'Sign in'} onPress={onSubmit} loading={loading} />
          <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={{ marginTop: 16 }}>
            <Text style={styles.link}>Forgot password? Get a reset link by email</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  wrap: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.white, borderRadius: 24, padding: 22, borderWidth: 1, borderColor: colors.line },
  brand: { fontSize: 26, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  lead: { color: colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 18, fontSize: 15 },
  tabs: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 16, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  tabOn: { backgroundColor: colors.white },
  tabText: { fontWeight: '700', color: colors.muted },
  tabTextOn: { color: colors.primary },
  error: { color: colors.danger, marginBottom: 10 },
  hint: { color: colors.muted, fontSize: 13, marginBottom: 12 },
  link: { color: colors.primary, textAlign: 'center', fontWeight: '600' },
});
