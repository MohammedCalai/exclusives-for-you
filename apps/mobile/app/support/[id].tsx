import { useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../../src/api';
import { Field, PrimaryButton } from '../../src/components';
import { colors, radius, spacing, typography } from '../../src/theme';

type Message = { id: string; body: string; senderType: 'CUSTOMER' | 'ADMIN'; createdAt: string; sender?: { firstName: string } };
type Thread = { id: string; subject: string; status: string; messages: Message[] };

export default function SupportChat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [thread, setThread] = useState<Thread>();
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const load = () => id ? api<Thread>(`/support/threads/${id}`).then(setThread).catch(() => undefined) : undefined;
  useEffect(() => { load(); const timer = setInterval(load, 5000); return () => clearInterval(timer); }, [id]);

  const send = async () => {
    if (!id || !body.trim()) return;
    Keyboard.dismiss();
    try {
      setSending(true);
      const updated = await api<Thread>(`/support/threads/${id}/messages`, { method: 'POST', body: JSON.stringify({ body }) });
      setThread(updated); setBody('');
      requestAnimationFrame(() => scroll.current?.scrollToEnd({ animated: true }));
    } catch (error) {
      Alert.alert('Could not send', error instanceof Error ? error.message : 'Please try again');
    } finally { setSending(false); }
  };

  if (!thread) return <View style={s.center}><Text>Loading conversation…</Text></View>;
  return <KeyboardAvoidingView style={s.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
    <View style={s.header}><Text style={s.kicker}>XCLUSIVEZ SUPPORT</Text><Text style={s.title}>{thread.subject}</Text><Text style={s.status}>{thread.status === 'OPEN' ? 'Studio team is available' : 'Conversation closed'}</Text></View>
    <ScrollView ref={scroll} contentContainerStyle={s.messages} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>{thread.messages.map((message) => <View key={message.id} style={[s.bubble, message.senderType === 'CUSTOMER' ? s.customer : s.admin]}><Text style={s.sender}>{message.senderType === 'ADMIN' ? 'Xclusivez studio' : 'You'}</Text><Text style={[s.message, message.senderType === 'ADMIN' && s.adminMessage]}>{message.body}</Text><Text style={s.time}>{new Date(message.createdAt).toLocaleString('en-GB')}</Text></View>)}</ScrollView>
    <View style={s.composer}><Field label="Message" value={body} onChangeText={setBody} placeholder="Write a reply..." multiline /><PrimaryButton loading={sending} disabled={!body.trim()} onPress={send}>Send message</PrimaryButton></View>
  </KeyboardAvoidingView>;
}

const s = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.paper }, center: { flex: 1, alignItems: 'center', justifyContent: 'center' }, header: { padding: spacing.lg, backgroundColor: colors.ink, gap: spacing.xs }, kicker: { ...typography.label, color: colors.accent }, title: { ...typography.title, color: colors.white }, status: { color: colors.stone, fontSize: 12 }, messages: { padding: spacing.lg, gap: spacing.md, flexGrow: 1, justifyContent: 'flex-end' }, bubble: { maxWidth: '86%', padding: spacing.md, borderRadius: radius.md, gap: 4 }, customer: { alignSelf: 'flex-end', backgroundColor: colors.ink }, admin: { alignSelf: 'flex-start', backgroundColor: colors.white }, sender: { color: colors.accent, fontWeight: '800', fontSize: 11 }, message: { color: colors.white, lineHeight: 20 }, adminMessage: { color: colors.ink }, time: { color: colors.stone, fontSize: 10 }, composer: { padding: spacing.md, backgroundColor: colors.white, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.stone } });
