import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true }) });

export async function registerForOfferNotifications() {
  if (!Constants.isDevice) return;
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return;
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await api('/notifications/push-token', { method: 'POST', body: JSON.stringify({ token, platform: Platform.OS }) });
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('offers', { name: 'Offers just for you', importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' });
}
