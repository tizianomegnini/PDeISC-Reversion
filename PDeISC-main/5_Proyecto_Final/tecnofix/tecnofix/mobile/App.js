import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { authApi, restoreToken, saveToken } from './src/api';
import AdminScreen from './src/AdminScreen';
import AuthScreen from './src/AuthScreen';
import DetailScreen from './src/DetailScreen';
import HomeScreen from './src/HomeScreen';
import ProfileScreen from './src/ProfileScreen';
import { Button, Loading, colors, fullName, styles } from './src/ui';

export default function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState('home');
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoreError, setRestoreError] = useState('');

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
  const logout = () => Alert.alert('Cerrar sesión', '¿Querés salir de TecnoFix?', [
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
    return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><Loading label="Iniciando TecnoFix…" /></SafeAreaView>;
  }
  if (!user) {
    return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><AuthScreen onSession={onAuthenticated} initialError={restoreError} /></SafeAreaView>;
  }

  const isAdmin = user.rol === 'admin';
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={{ flex: 1 }}>
        <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 8 }}>
          <View style={styles.spaceBetween}>
            <Pressable onPress={() => setScreen(user.debe_cambiar_password ? 'password' : 'home')}>
              <Text style={{ color: colors.primaryDark, fontSize: 20, fontWeight: '900' }}>TecnoFix</Text>
            </Pressable>
            <Text numberOfLines={1} style={{ color: colors.muted, flexShrink: 1, marginLeft: 8 }}>{fullName(user)} · {user.rol}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {!user.debe_cambiar_password && <Button title={isAdmin ? 'Panel admin' : user.rol === 'tecnico' ? 'Mis casos' : 'Mis consultas'} small onPress={() => setScreen('home')} />}
            {!user.debe_cambiar_password && isAdmin && <Button title="Administración" small variant="secondary" onPress={() => setScreen('admin')} />}
            {!user.debe_cambiar_password && <Button title="Perfil" small variant="secondary" onPress={() => setScreen('profile')} />}
            <Button title="Salir" small variant="danger" onPress={logout} />
          </ScrollView>
        </View>
        <View style={styles.container}>
          {screen === 'home' && user.rol === 'admin'
            ? <AdminScreen onOpenConsultation={(id) => goTo('detail', id)} />
            : screen === 'home'
              ? <HomeScreen user={user} onNavigate={goTo} />
              : screen === 'admin' && user.rol === 'admin'
                ? <AdminScreen onOpenConsultation={(id) => goTo('detail', id)} />
                : screen === 'detail'
                  ? <DetailScreen id={selectedId} user={user} onBack={() => setScreen(isAdmin ? 'admin' : 'home')} onDone={() => setScreen('admin')} />
                  : screen === 'password'
                    ? <ProfileScreen user={user} onBack={() => setScreen('home')} onUserUpdated={onUserUpdated} mustChangePassword />
                    : <ProfileScreen user={user} onBack={() => setScreen('home')} onUserUpdated={onUserUpdated} />}
        </View>
      </View>
    </SafeAreaView>
  );
}
