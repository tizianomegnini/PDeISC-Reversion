import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView as InsetsSafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi, restoreToken, saveToken } from './src/api';
import AdminScreen from './src/AdminScreen';
import AuthScreen from './src/AuthScreen';
import DetailScreen from './src/DetailScreen';
import HomeScreen from './src/HomeScreen';
import ProfileScreen from './src/ProfileScreen';
import { BrandMark, Loading, colors, fullName, getThemeMode, saveThemeMode, setThemeMode, styles, restoreThemeMode } from './src/ui';

function TabBar({ user, screen, onNavigate, bottomInset }) {
  const tabs = [
    { id: 'home', label: user.rol === 'tecnico' ? 'Mis casos' : 'Inicio', icon: '⌂' },
    ...(user.rol === 'admin' ? [{ id: 'admin', label: 'Gestión', icon: '▦' }] : []),
    { id: 'profile', label: 'Perfil', icon: '◉' },
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

function roleLabel(role) {
  return ({ cliente: 'Cliente', tecnico: 'Técnico', admin: 'Administrador' })[role] || role;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('home');
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoreError, setRestoreError] = useState('');
  const [themeMode, setThemeModeState] = useState(getThemeMode());

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

  const changeTheme = async (mode) => {
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
        if (error.status === 401) await saveToken(null);
        else if (active) setRestoreError(error.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    restore();
    return () => { active = false; };
  }, []);

  const goTo = (next, id = null) => {
    setSelectedId(id);
    setScreen(next);
  };
  const logout = () => Alert.alert('Cerrar sesión', '¿Querés salir de TecnoFix Soporte?', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Cerrar sesión', style: 'destructive', onPress: async () => {
      await saveToken(null);
      setUser(null);
      setScreen('home');
    } },
  ]);
  const onUserUpdated = (next) => {
    setUser(next);
    if (!next.debe_cambiar_password && screen === 'password') setScreen('home');
  };
  const onAuthenticated = (next) => {
    setUser(next);
    setScreen(next.debe_cambiar_password ? 'password' : 'home');
  };

  if (loading) {
    return <InsetsSafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safe}><StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} /><Loading label="Iniciando TecnoFix Soporte…" /></InsetsSafeAreaView>;
  }
  if (!user) {
    return <InsetsSafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safe}><StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} backgroundColor={colors.background} /><AuthScreen onSession={onAuthenticated} initialError={restoreError} themeMode={themeMode} onThemeChange={changeTheme} /></InsetsSafeAreaView>;
  }

  const isAdmin = user.rol === 'admin';
  return (
    <InsetsSafeAreaView edges={['top', 'right', 'left']} style={styles.safe}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} backgroundColor={colors.surface} />
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
        {!user.debe_cambiar_password && (
          <TabBar user={user} screen={screen} onNavigate={(next) => setScreen(next)} bottomInset={insets.bottom} />
        )}
      </View>
    </InsetsSafeAreaView>
  );
}
