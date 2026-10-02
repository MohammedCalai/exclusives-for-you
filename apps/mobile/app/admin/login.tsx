import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { api } from '../../src/api';
import { Field, PrimaryButton } from '../../src/components';
import { colors, spacing, typography } from '../../src/theme';

export default function AdminLogin() {
  const router = useRouter(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async () => { try { setLoading(true); const data = await api<{ accessToken: string; refreshToken: string; user: { role: string } }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); if (data.user.role !== 'ADMIN') throw new Error('This account does not have admin access'); await Promise.all([SecureStore.setItemAsync('accessToken', data.accessToken), SecureStore.setItemAsync('refreshToken', data.refreshToken)]); router.replace('/admin'); } catch (error) { Alert.alert('Admin sign in failed', error instanceof Error ? error.message : 'Please try again'); } finally { setLoading(false); } };
  return <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={s.copy}><Text style={s.kicker}>XCLUSIVEZ 4 YOU · STUDIO</Text><Text style={s.title}>Manage the edit.</Text><Text style={s.body}>Sign in to publish products, review orders and send private offers.</Text></View><View style={s.form}><Field label="Admin email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry /><PrimaryButton loading={loading} disabled={!email || !password} onPress={submit}>Open admin studio</PrimaryButton></View></KeyboardAvoidingView>;
}
const s = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.ink, padding: spacing.lg, justifyContent: 'center' }, copy: { gap: spacing.sm, marginBottom: spacing.xl }, kicker: { ...typography.label, color: colors.accent }, title: { ...typography.display, color: colors.white }, body: { ...typography.body, color: colors.stone }, form: { gap: spacing.md } });
