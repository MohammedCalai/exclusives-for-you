import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard, ScreenHeader, SearchBox } from '../../src/components';
import { getProducts } from '../../src/api';
import type { Product } from '../../src/sample-products';
import { colors, spacing, typography } from '../../src/theme';
export default function Search() { const [query, setQuery] = useState(''); const [results, setResults] = useState<Product[]>([]); useEffect(() => { const timer = setTimeout(() => { if (query.trim().length > 1) getProducts(`?q=${encodeURIComponent(query)}`).then(setResults); else setResults([]); }, 250); return () => clearTimeout(timer); }, [query]); return <SafeAreaView style={s.page} edges={['top']}><ScreenHeader title="Find your next favourite" /><SearchBox value={query} onChangeText={setQuery} />{query.length < 2 ? <View style={s.empty}><Text style={s.emptyTitle}>Search the edit</Text><Text style={s.emptyBody}>Try a brand, product name or style — like “Nike”, “Samba” or “overshirt”.</Text></View> : <ScrollView contentContainerStyle={s.grid}>{results.length ? results.map((p) => <ProductCard key={p.id} product={p} />) : <Text style={s.emptyBody}>No pieces match “{query}”.</Text>}</ScrollView>}</SafeAreaView>; }
const s = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.paper }, empty: { padding: spacing.xl, marginTop: spacing.xl, alignItems: 'center', gap: spacing.sm }, emptyTitle: { ...typography.title, color: colors.ink }, emptyBody: { ...typography.body, color: colors.muted, textAlign: 'center' }, grid: { padding: spacing.lg, flexDirection: 'row', flexWrap: 'wrap', gap: '4%' } });
