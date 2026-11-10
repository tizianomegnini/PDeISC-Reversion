import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { notificationsApi } from '../../api';

const PUSH_TOKEN_KEY = 'tecnofix-push-token';
export type PushRegistrationResult = { status: 'unsupported' | 'denied' | 'registered' };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerPushNotifications(): Promise<PushRegistrationResult> {
  if (Platform.OS !== 'android' && Platform.OS !== 'ios') return { status: 'unsupported' };
  if (!Device.isDevice) return { status: 'unsupported' };

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificaciones de TecnoFix',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#087E8B',
    });
  }

  let permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== 'granted' && permissions.canAskAgain) {
    permissions = await Notifications.requestPermissionsAsync();
  }
  if (permissions.status !== 'granted') return { status: 'denied' };

  const projectId = Constants.easConfig?.projectId || Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error('Falta el identificador de proyecto EAS para registrar notificaciones.');

  const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await notificationsApi.registerDevice(pushToken, Platform.OS);
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, pushToken);
  return { status: 'registered' };
}

export async function unregisterPushNotifications() {
  const pushToken = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  if (!pushToken) return;
  await notificationsApi.unregisterDevice(pushToken);
  await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
}
