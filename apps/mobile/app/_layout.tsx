import { StripeProvider } from '@stripe/stripe-react-native';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../src/theme';
import '../src/notifications';

export default function RootLayout() {
  const router = useRouter();
  useEffect(() => Notifications.addNotificationResponseReceivedListener((response) => { const deeplink = response.notification.request.content.data?.deeplink; if (typeof deeplink === 'string') router.push(deeplink as never); }).remove, [router]);
  return <SafeAreaProvider><StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_not_configured'} merchantIdentifier="merchant.com.bondu17.exclusivesforyou"><StatusBar style="dark" /><Stack screenOptions={{ headerStyle: { backgroundColor: colors.paper }, headerShadowVisible: false, headerTintColor: colors.ink, contentStyle: { backgroundColor: colors.paper }, headerBackTitle: 'Back' }}><Stack.Screen name="index" options={{ headerShown: false }} /><Stack.Screen name="welcome" options={{ headerShown: false }} /><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="auth/login" options={{ title: 'Sign in' }} /><Stack.Screen name="auth/register" options={{ title: 'Create account' }} /><Stack.Screen name="auth/forgot-password" options={{ title: 'Reset password' }} /><Stack.Screen name="product/[slug]" options={{ title: '' }} /><Stack.Screen name="filters" options={{ presentation: 'modal', title: 'Filters' }} /><Stack.Screen name="basket" options={{ title: 'Your basket' }} /><Stack.Screen name="checkout/delivery" options={{ title: 'Delivery details' }} /><Stack.Screen name="checkout/payment" options={{ title: 'Payment' }} /><Stack.Screen name="checkout/confirmation" options={{ headerShown: false }} /><Stack.Screen name="orders/index" options={{ title: 'Your orders' }} /><Stack.Screen name="orders/[orderNumber]" options={{ title: 'Order details' }} /><Stack.Screen name="notifications/index" options={{ title: 'Notifications' }} /><Stack.Screen name="support/index" options={{ title: 'Message us' }} /><Stack.Screen name="support/[id]" options={{ title: 'Support chat' }} /><Stack.Screen name="account/settings" options={{ title: 'Account settings' }} /><Stack.Screen name="admin/login" options={{ title: 'Admin sign in' }} /><Stack.Screen name="admin/index" options={{ title: 'Admin studio' }} /><Stack.Screen name="admin/support" options={{ title: 'Support inbox' }} /></Stack></StripeProvider></SafeAreaProvider>;
}
