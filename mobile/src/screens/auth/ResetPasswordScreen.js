import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import api from '../../config/api';
import { Card, Field, PrimaryButton, Screen, Subtitle, Title } from '../../components/ui';
import { colors } from '../../theme';

export default function ResetPasswordScreen({ navigation }) {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('The two passwords do not match.');
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, password });
      setMessage('Password changed. You can sign in now.');
      setTimeout(() => navigation.navigate('Login'), 1200);
    } catch (e) {
      setError(e.response?.data?.error || 'This link is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Title>Set a new password</Title>
      <Subtitle>Paste the token from your email, then choose a new password.</Subtitle>
      <Card>
        {error ? <Text style={{ color: colors.danger, marginBottom: 8 }}>{error}</Text> : null}
        {message ? <Text style={{ color: colors.success, marginBottom: 8 }}>{message}</Text> : null}
        <Field label="Reset token" value={token} onChangeText={setToken} />
        <Field label="New password" value={password} onChangeText={setPassword} secure />
        <Field label="Type it again" value={confirm} onChangeText={setConfirm} secure />
        <PrimaryButton title="Save password" onPress={save} loading={loading} />
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.muted }}>Back</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
