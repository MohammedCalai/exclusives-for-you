import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard, ScreenHeader } from '../../src/components';
import { getProducts } from '../../src/api';
import type { Product } from '../../src/sample-products';
import { useShop } from '../../src/store';
import { colors, spacing, typography } from '../../src/theme';

export default function Favourites() {
  const ids = useShop((state) => state.favourites);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      setProducts((await getProducts()).filter((product) => ids.includes(product.id)));
    } catch {
      setProducts([]);
    } finally {
      setRefreshing(false);
    }
  }, [ids]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return <SafeAreaView style={s.page} edges={['top']}><ScreenHeader title="Saved" subtitle="Your shortlist, ready when you are." />{products.length ? <ScrollView contentContainerStyle={s.grid} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}>{products.map((product) => <ProductCard key={product.id} product={product} />)}</ScrollView> : <View style={s.empty}><Text style={s.heart}>♡</Text><Text style={s.emptyTitle}>Nothing saved yet</Text><Text style={s.emptyBody}>Tap the heart on any product to keep it close.</Text><Link href="/(tabs)/shop" asChild><Pressable style={s.outline}><Text style={s.outlineText}>Explore the collection</Text></Pressable></Link></View>}</SafeAreaView>;
}
const s = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.paper }, grid: { padding: spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: '4%' }, empty: { flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center', gap: spacing.sm }, heart: { fontSize: 54, color: colors.accent }, emptyTitle: { ...typography.title }, emptyBody: { ...typography.body, color: colors.muted }, outline: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.ink, borderRadius: 28, paddingVertical: spacing.md, paddingHorizontal: spacing.lg }, outlineText: { fontWeight: '700', color: colors.ink } });
