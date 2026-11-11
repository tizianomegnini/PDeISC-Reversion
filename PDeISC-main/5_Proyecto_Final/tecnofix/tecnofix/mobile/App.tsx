import React, { useEffect, useState } from 'react';
import { Alert, Keyboard, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView as InsetsSafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { ApiError, authApi, restoreToken, saveToken } from './src/api';
import { registerPushNotifications, unregisterPushNotifications } from './src/features/notifications';
import { AdminScreen } from './src/features/admin';
import { AuthScreen } from './src/features/auth';
import { DetailScreen, HomeScreen } from './src/features/consultations';
import { ProfileScreen } from './src/features/profile';
import { BrandMark, Loading, colors, fullName, getThemeMode, saveThemeMode, setThemeMode, styles, restoreThemeMode } from './src/ui';
import { getErrorMessage, type ThemeMode, type User, type UserRole } from './src/types';

type Screen = 'home' | 'profile' | 'admin' | 'detail' | 'password';
type TabId = 'home' | 'profile' | 'admin';

/**
 * Barra inferior de navegación usada para cambiar entre las vistas principales de la app.
 * Ajusta el label y el estado activo según el rol del usuario y la pantalla actual.
 */
function TabBar({ user, screen, onNavigate, bottomInset }: {
  user: User;
  screen: Screen;
  onNavigate: (screen: TabId) => void;
  bottomInset: number;
}) {
  const tabs: Array<{ id: TabId; label: string; icon: string }> = [
    { id: 'home' as const, label: user.rol === 'tecnico' ? 'Mis casos' : 'Inicio', icon: '⌂' },
    ...(user.rol === 'admin' ? [{ id: 'admin' as const, label: 'Gestión', icon: '▦' }] : []),
    { id: 'profile' as const, label: 'Perfil', icon: '◉' },
  ];
  const activeTab = screen === 'profile' ? 'profile' : screen === 'admin' ? 'admin' : 'home';

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(bottomInset, 8) }]}>
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onNavigate(tab.id)}
            style={[styles.tab, active && styles.tabActive]}
          >
            <Text style={[styles.tabIcon, active && styles.tabIconActive]}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Traduce el rol del usuario a una etiqueta amigable para el header de la app.
 */
function roleLabel(role: UserRole): string {
  return ({ cliente: 'Cliente', tecnico: 'Técnico', admin: 'Administrador' })[role];
}

/**
 * Devuelve el contenedor principal de la app con SafeArea y la jerarquía de pantallas.
 * La sesión y el tema se resuelven dentro del árbol para que el resto de vistas compartan el mismo estado.
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

/**
 * Mantiene la sesión activa, la navegación global y los efectos secundarios de autenticación,
 * tema y notificaciones. Es el punto de coordinación entre las pantallas del flujo móvil.
 */
function AppContent() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoreError, setRestoreError] = useState('');
  const [themeMode, setThemeModeState] = useState(getThemeMode());
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [notificationTarget, setNotificationTarget] = useState<number | null>(null);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
      const consultationId = Number(response.notification.request.content.data?.consultaId);
      if (Number.isInteger(consultationId) && consultationId > 0) setNotificationTarget(consultationId);
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    Notifications.getLastNotificationResponseAsync().then(async (response) => {
      if (response) handleNotificationResponse(response);
      await Notifications.clearLastNotificationResponseAsync();
    }).catch((error) => {
      console.error('No se pudo procesar la notificación abierta:', error);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!user || user.rol === 'admin' || user.debe_cambiar_password) return;
    registerPushNotifications().then(({ status }) => {
      if (status === 'denied') console.info('Las notificaciones están desactivadas para esta app.');
      if (status === 'unsupported') console.info('Las notificaciones push requieren un dispositivo Android o iOS físico.');
    }).catch((error) => {
      console.error('No se pudieron activar las notificaciones móviles:', error);
    });
  }, [user?.id, user?.rol, user?.debe_cambiar_password]);

  useEffect(() => {
    if (!user || !notificationTarget) return;
    setSelectedId(notificationTarget);
    setScreen('detail');
    setNotificationTarget(null);
  }, [user, notificationTarget]);

  useEffect(() => {
    let active = true;
    restoreThemeMode().then((mode) => {
      if (!active) return;
      setThemeMode(mode);
      setThemeModeState(mode);
    }).catch((error) => {
      console.error('No se pudo restaurar el tema guardado:', error);
    });
    return () => { active = false; };
  }, []);

/**
 * Guarda la preferencia del tema y refleja el cambio en la UI.
 * Si el almacenamiento falla, la app sigue con el tema activo pero avisa al usuario.
 */
  const changeTheme = async (mode: ThemeMode) => {
    const nextMode = setThemeMode(mode);
    setThemeModeState(nextMode);
    try {
      await saveThemeMode(nextMode);
    } catch (error) {
      console.error('No se pudo guardar la preferencia de tema:', error);
      Alert.alert('Tema no guardado', 'El tema cambió, pero no se pudo guardar la preferencia para la próxima vez.');
    }
  };

  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const token = await restoreToken();
        if (token) {
          const result = await authApi.me();
          if (active) {
            setUser(result.usuario);
            setScreen(result.usuario.debe_cambiar_password ? 'password' : 'home');
          }
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) await saveToken(null);
        else if (active) setRestoreError(getErrorMessage(error));
      } finally {
        if (active) setLoading(false);
      }
    };
    restore();
    return () => { active = false; };
  }, []);

/**
 * Navega entre pantallas con un posible contexto de detalle asociado a una consulta.
 */
  const goTo = (next: Screen, id: number | null = null) => {
    setSelectedId(id);
    setScreen(next);
  };
/**
 * Cierra la sesión del usuario y limpia las suscripciones de notificaciones locales.
 * El token se elimina de almacenamiento persistente y la app vuelve a la pantalla de login.
 */
  const logout = () => Alert.alert('Cerrar sesión', '¿Querés salir de TecnoFix Soporte?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Cerrar sesión', style: 'destructive', onPress: async () => {
      try {
        await unregisterPushNotifications();
      } catch (error) {
        console.error('No se pudo desvincular el dispositivo de las notificaciones:', error);
      }
      await saveToken(null);
      setUser(null);
      setScreen('home');
    } },
  ]);
/**
 * Refresca el usuario actual tras cambios de perfil o contraseña sin perder el estado de navegación.
 */
  const onUserUpdated = (next: User) => {
    setUser(next);
    if (!next.debe_cambiar_password && screen === 'password') setScreen('home');
  };
/**
 * Entrada del flujo de autenticación: activa la sesión y deriva a la pantalla de cambio de clave si corresponde.
 */
  const onAuthenticated = (next: User) => {
    setUser(next);
    setScreen(next.debe_cambiar_password ? 'password' : 'home');
  };

  if (loading) {
    return <InsetsSafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safe}><StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} /><Loading label="Iniciando TecnoFix Soporte…" /></InsetsSafeAreaView>;
  }
  if (!user) {
    return <InsetsSafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safe}><StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} /><AuthScreen onSession={onAuthenticated} initialError={restoreError} themeMode={themeMode} onThemeChange={changeTheme} /></InsetsSafeAreaView>;
  }

  const isAdmin = user.rol === 'admin';
  return (
    <InsetsSafeAreaView edges={['top', 'right', 'left']} style={styles.safe}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <View style={{ flex: 1 }}>
        <View style={styles.appHeader}>
          <View style={styles.spaceBetween}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ir al inicio"
              style={styles.headerBrand}
              onPress={() => setScreen(user.debe_cambiar_password ? 'password' : 'home')}
            >
              <BrandMark size={38} />
              <View>
                <Text style={styles.headerBrandName}>TecnoFix</Text>
                <Text style={styles.headerBrandSubtitle}>SOPORTE TÉCNICO</Text>
              </View>
            </Pressable>
            <View style={styles.headerIdentity}>
              <Text numberOfLines={1} style={styles.headerUser}>{fullName(user)}</Text>
              <Text style={styles.headerRole}>{roleLabel(user.rol)}</Text>
            </View>
            {!user.debe_cambiar_password && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={themeMode === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
                onPress={() => changeTheme(themeMode === 'dark' ? 'light' : 'dark')}
                style={styles.themeButton}
              >
                <Text style={styles.themeButtonText}>{themeMode === 'dark' ? '☀' : '☾'}</Text>
              </Pressable>
            )}
            {!user.debe_cambiar_password && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar sesión"
                onPress={logout}
                style={styles.headerLogout}
              >
                <Text style={styles.headerLogoutText}>Salir</Text>
              </Pressable>
            )}
          </View>
        </View>
        <View style={styles.screenContainer}>
          {screen === 'home' && user.rol === 'admin'
            ? <AdminScreen onOpenConsultation={(id) => goTo('detail', id)} />
            : screen === 'home'
              ? <HomeScreen user={user} onNavigate={goTo} />
              : screen === 'admin' && user.rol === 'admin'
                ? <AdminScreen onOpenConsultation={(id) => goTo('detail', id)} />
                : screen === 'detail'
                  ? <DetailScreen id={selectedId} user={user} onBack={() => setScreen(isAdmin ? 'admin' : 'home')} onDone={() => setScreen('admin')} />
                  : screen === 'password'
                    ? <ProfileScreen user={user} onBack={() => setScreen('home')} onUserUpdated={onUserUpdated} mustChangePassword themeMode={themeMode} onThemeChange={changeTheme} />
                    : <ProfileScreen user={user} onBack={() => setScreen('home')} onUserUpdated={onUserUpdated} themeMode={themeMode} onThemeChange={changeTheme} />}
        </View>
        {!user.debe_cambiar_password && !keyboardVisible && (
          <TabBar user={user} screen={screen} onNavigate={(next) => setScreen(next)} bottomInset={insets.bottom} />
        )}
      </View>
    </InsetsSafeAreaView>
  );
}
