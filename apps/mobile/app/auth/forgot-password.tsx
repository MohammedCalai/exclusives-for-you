import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { api } from '../../src/api';
import { Field, PrimaryButton } from '../../src/components';
import { colors, spacing, typography } from '../../src/theme';
export default function ForgotPassword() { const [email, setEmail] = useState(''); const [sent, setSent] = useState(false); const submit = async () => { try { await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); setSent(true); } catch { setSent(true); } }; return <View style={s.page}>{sent ? <><Text style={s.title}>Check your inbox.</Text><Text style={s.body}>If an account exists for {email}, a secure reset link is on its way.</Text></> : <><Text style={s.title}>Reset your password.</Text><Text style={s.body}>Enter your email and we’ll send a time-limited reset link.</Text><Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /><PrimaryButton onPress={submit} disabled={!email}>Send reset link</PrimaryButton></>}</View>; }
const s = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.paper, padding: spacing.lg, gap: spacing.lg }, title: { ...typography.display, marginTop: spacing.xl }, body: { ...typography.body, color: colors.muted } });
