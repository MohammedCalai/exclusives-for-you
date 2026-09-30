import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard, ScreenHeader } from '../../src/components';
import { sampleProducts } from '../../src/sample-products';
import { useShop } from '../../src/store';
import { colors, spacing, typography } from '../../src/theme';
export default function Favourites() { const ids = useShop((s) => s.favourites); const products = sampleProducts.filter((p) => ids.includes(p.id)); return <SafeAreaView style={s.page} edges={['top']}><ScreenHeader title="Saved" subtitle="Your shortlist, ready when you are." />{products.length ? <ScrollView contentContainerStyle={s.grid}>{products.map((p) => <ProductCard key={p.id} product={p} />)}</ScrollView> : <View style={s.empty}><Text style={s.heart}>♡</Text><Text style={s.emptyTitle}>Nothing saved yet</Text><Text style={s.emptyBody}>Tap the heart on any product to keep it close.</Text><Link href="/(tabs)/shop" asChild><Pressable style={s.outline}><Text style={s.outlineText}>Explore the collection</Text></Pressable></Link></View>}</SafeAreaView>; }
const s = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.paper }, grid: { padding: spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: '4%' }, empty: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center', gap: spacing.sm }, heart: { fontSize: 54, color: colors.accent }, emptyTitle: { ...typography.title }, emptyBody: { ...typography.body, color: colors.muted }, outline: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.ink, borderRadius: 28, paddingVertical: spacing.md, paddingHorizontal: spacing.lg }, outlineText: { fontWeight: '700', color: colors.ink } });
