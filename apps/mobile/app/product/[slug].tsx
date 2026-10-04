import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api, getProduct } from '../../src/api';
import { Field, PrimaryButton } from '../../src/components';
import type { Product } from '../../src/sample-products';
import { useShop } from '../../src/store';
import { colors, money, radius, spacing, typography } from '../../src/theme';

export default function ProductDetails() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product>();
  const [size, setSize] = useState('');
  const [offerOpen, setOfferOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const { favourites, toggleFavourite, addToBasket } = useShop();

  useEffect(() => { if (slug) getProduct(slug).then(setProduct); }, [slug]);
  const selected = useMemo(() => product?.variants?.find((variant) => variant.size === size), [product, size]);
  if (!product) return <View style={s.loading}><Text>Loading piece…</Text></View>;

  const save = (product.retailPricePence ?? product.pricePence) - product.pricePence;
  const closeOffer = () => { Keyboard.dismiss(); setOfferOpen(false); };
  const add = () => {
    if (!selected || selected.stock < 1) return;
    addToBasket(product, size, selected.id);
    Alert.alert('Added to basket', `${product.name}, size ${size}`);
  };
  const submitOffer = async () => {
    Keyboard.dismiss();
    try {
      await api('/offers', { method: 'POST', body: JSON.stringify({ productId: product.id, variantId: selected?.id, amountPence: Math.round(Number(offerAmount) * 100), message: offerMessage || undefined }) });
      setOfferOpen(false);
      setOfferAmount('');
      setOfferMessage('');
      Alert.alert('Offer sent', 'We’ll let you know when the seller responds.');
    } catch (error) {
      Alert.alert('Could not send offer', error instanceof Error ? error.message : 'Sign in to make an offer');
    }
  };

  return <View style={s.page}>
    <ScrollView showsVerticalScrollIndicator={false} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled">
      <View style={s.gallery}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>{(product.images?.length ? product.images : [product.imageUrl]).map((uri) => <Image key={uri} source={{ uri }} style={s.image} contentFit="cover" />)}</ScrollView>
        <SafeAreaView style={s.overlay} edges={['top']}>
          <Pressable onPress={() => router.back()} style={s.circle}><Ionicons name="arrow-back" size={22} /></Pressable>
          <Pressable onPress={() => toggleFavourite(product.id)} style={s.circle}><Ionicons name={favourites.includes(product.id) ? 'heart' : 'heart-outline'} size={22} color={favourites.includes(product.id) ? colors.danger : colors.ink} /></Pressable>
        </SafeAreaView>
      </View>
      <View style={s.body}>
        <Text style={s.brand}>{product.brand}</Text><Text style={s.name}>{product.name}</Text><Text style={s.colour}>{product.colour}</Text>
        <View style={s.prices}><Text style={s.price}>{money(product.pricePence)}</Text>{product.retailPricePence ? <Text style={s.was}>{money(product.retailPricePence)}</Text> : null}{save > 0 ? <Text style={s.save}>Save {money(save)}</Text> : null}</View>
        <View style={s.divider} /><View style={s.sizeHead}><Text style={s.heading}>Select size</Text><Text style={s.guide}>Size guide</Text></View>
        <View style={s.sizes}>{product.variants?.map((variant) => <Pressable key={variant.id} disabled={variant.stock < 1} onPress={() => setSize(variant.size)} style={[s.size, size === variant.size && s.selected, variant.stock < 1 && s.sold]}><Text style={[s.sizeText, size === variant.size && s.selectedText]}>{variant.size}</Text>{variant.stock < 1 ? <View style={s.strike} /> : null}</Pressable>)}</View>
        <Text style={s.stock}>{selected ? selected.stock > 0 ? `Only ${selected.stock} available` : 'This size is out of stock' : 'Choose an available size'}</Text>
        <PrimaryButton onPress={add} disabled={!selected || selected.stock < 1}>Add to basket</PrimaryButton>
        <Pressable onPress={() => { add(); router.push('/basket'); }} disabled={!selected || selected.stock < 1} style={s.buy}><Text style={s.buyText}>Buy now</Text></Pressable>
        <Pressable onPress={() => setOfferOpen(true)} style={s.offer}><Text style={s.offerText}>Make an offer</Text></Pressable>
        <View style={s.divider} /><Text style={s.heading}>About this piece</Text><Text style={s.description}>{product.description}</Text>
        <Info icon="cube-outline" title="Delivery" body="Free UK delivery over £100. Standard delivery in 2–4 working days." />
        <Info icon="return-down-back-outline" title="Returns" body="Return within 14 days in original condition." />
        <Info icon="shield-checkmark-outline" title="Authenticity" body="Every product is checked before dispatch." />
      </View>
    </ScrollView>
    <Modal visible={offerOpen} transparent animationType="slide" onRequestClose={closeOffer}>
      <KeyboardAvoidingView style={s.modalShade} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={s.modalBackdrop} onPress={Keyboard.dismiss} accessibilityRole="button" accessibilityLabel="Hide keyboard" />
        <View style={s.modal}>
          <Text style={s.heading}>Make an offer</Text>
          <Text style={s.modalBody}>Your offer for {product.name}{selected ? ` · size ${selected.size}` : ''} is sent securely to the Xclusivez studio.</Text>
          <Field label="Offer price (£)" value={offerAmount} onChangeText={setOfferAmount} keyboardType="decimal-pad" placeholder={(product.pricePence / 100).toFixed(2)} />
          <Field label="Message (optional)" value={offerMessage} onChangeText={setOfferMessage} multiline />
          <PrimaryButton onPress={submitOffer} disabled={!offerAmount || Number(offerAmount) <= 0}>Send offer</PrimaryButton>
          <Pressable onPress={closeOffer}><Text style={s.cancel}>Cancel</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  </View>;
}

function Info({ icon, title, body }: { icon: any; title: string; body: string }) { return <View style={s.info}><Ionicons name={icon} size={22} /><View style={{ flex: 1 }}><Text style={s.infoTitle}>{title}</Text><Text style={s.infoBody}>{body}</Text></View></View>; }

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' }, gallery: { height: 470, backgroundColor: colors.stone }, image: { width: 390, height: 470 }, overlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.md, flexDirection: 'row', justifyContent: 'space-between' }, circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,.92)', alignItems: 'center', justifyContent: 'center' }, body: { padding: spacing.lg, gap: spacing.sm }, brand: { ...typography.label, color: colors.muted }, name: { ...typography.title, fontSize: 28 }, colour: { ...typography.body, color: colors.muted }, prices: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs }, price: { fontSize: 23, fontWeight: '700' }, was: { color: colors.muted, textDecorationLine: 'line-through' }, save: { color: colors.success, fontWeight: '700' }, divider: { height: 1, backgroundColor: colors.stone, marginVertical: spacing.md }, sizeHead: { flexDirection: 'row', justifyContent: 'space-between' }, heading: { ...typography.heading }, guide: { color: colors.muted, textDecorationLine: 'underline' }, sizes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, size: { width: 58, height: 48, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.stone, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }, selected: { backgroundColor: colors.ink, borderColor: colors.ink }, sold: { opacity: .35 }, sizeText: { fontWeight: '600' }, selectedText: { color: colors.white }, strike: { position: 'absolute', width: 55, height: 1, backgroundColor: colors.muted, transform: [{ rotate: '-40deg' }] }, stock: { color: colors.muted, marginBottom: spacing.sm }, buy: { minHeight: 54, borderRadius: 27, borderWidth: 1, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }, buyText: { fontWeight: '700' }, offer: { minHeight: 54, borderRadius: 27, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, offerText: { color: colors.ink, fontWeight: '800' }, description: { ...typography.body, color: colors.muted, marginBottom: spacing.md }, info: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.stone }, infoTitle: { fontWeight: '700', marginBottom: 3 }, infoBody: { color: colors.muted, lineHeight: 20 }, modalShade: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.45)' }, modalBackdrop: { ...StyleSheet.absoluteFillObject }, modal: { backgroundColor: colors.paper, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, gap: spacing.md }, modalBody: { ...typography.body, color: colors.muted }, cancel: { textAlign: 'center', fontWeight: '700', padding: spacing.sm }
});
