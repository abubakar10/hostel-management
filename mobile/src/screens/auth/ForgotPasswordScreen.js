import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import api from '../../config/api';
import { Card, Field, PrimaryButton, Screen, Subtitle, Title } from '../../components/ui';
import { colors } from '../../theme';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      setMessage(res.data?.message || 'If that account exists, we sent a link.');
    } catch (e) {
      setError(e.response?.data?.error || 'Could not send the link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Title>Forgot password</Title>
      <Subtitle>Type your email or student ID. We will send a link if that account exists.</Subtitle>
      <Card>
        {error ? <Text style={{ color: colors.danger, marginBottom: 8 }}>{error}</Text> : null}
        {message ? <Text style={{ color: colors.success, marginBottom: 8 }}>{message}</Text> : null}
        <Field label="Email or Student ID" value={email} onChangeText={setEmail} />
        <PrimaryButton title="Send me a reset link" onPress={send} loading={loading} />
        <Pressable onPress={() => navigation.navigate('ResetPassword')} style={{ marginTop: 14 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>I already have a reset token</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 10 }}>
          <Text style={{ color: colors.muted }}>Back to sign in</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}
