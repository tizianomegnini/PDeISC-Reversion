import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { authApi } from './api';
import { Button, Card, Field, Heading, Message, MotionScrollView, fullName, styles } from './ui';

export default function ProfileScreen({ user, onBack, onUserUpdated, mustChangePassword = false, themeMode = 'light', onThemeChange }) {
  const [profile, setProfile] = useState({
    nombre: user.nombre || '',
    apellido: user.apellido || '',
    telefono: user.telefono || '',
  });
  const [password, setPassword] = useState({ actual: '', nueva: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const updateProfileField = (key) => (value) => setProfile((current) => ({ ...current, [key]: value }));
  const updatePasswordField = (key) => (value) => setPassword((current) => ({ ...current, [key]: value }));

  const saveProfile = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await authApi.updateProfile(profile);
      onUserUpdated(result.usuario);
      setSuccess('Perfil actualizado.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const savePassword = async () => {
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await authApi.changePassword(password);
      const result = await authApi.me();
      onUserUpdated(result.usuario);
      setPassword({ actual: '', nueva: '' });
      setSuccess('Contraseña actualizada.');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const submitPassword = () => {
    if (mustChangePassword && !password.actual) {
      Alert.alert('Cambiar contraseña', 'Ingresá tu contraseña actual y la nueva contraseña.');
      return;
    }
    savePassword();
  };

  return (
    <MotionScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {!mustChangePassword && <Button title="← Volver" onPress={onBack} variant="secondary" />}
      <Heading title={mustChangePassword ? 'Cambiar contraseña' : 'Mi perfil'} subtitle={mustChangePassword ? 'Por seguridad, actualizá tu contraseña para continuar.' : `${fullName(user)} · ${user.email}`} />
      {!mustChangePassword && <Card>
        <Heading title="Apariencia" subtitle="Elegí cómo querés ver TecnoFix en tu celular." />
        <View style={styles.themeOptions}>
          <View style={styles.themeOption}>
            <Button title={themeMode === 'light' ? '✓ Claro' : 'Claro'} onPress={() => onThemeChange?.('light')} variant={themeMode === 'light' ? 'primary' : 'secondary'} />
          </View>
          <View style={styles.themeOption}>
            <Button title={themeMode === 'dark' ? '✓ Oscuro' : 'Oscuro'} onPress={() => onThemeChange?.('dark')} variant={themeMode === 'dark' ? 'primary' : 'secondary'} />
          </View>
        </View>
      </Card>}
      {!mustChangePassword && <Card>
        <Heading title="Datos personales" subtitle={user.email} />
        <Field label="Nombre" value={profile.nombre} onChangeText={updateProfileField('nombre')} maxLength={80} />
        <Field label="Apellido" value={profile.apellido} onChangeText={updateProfileField('apellido')} maxLength={80} />
        <Field label="Teléfono" value={profile.telefono} onChangeText={updateProfileField('telefono')} keyboardType="phone-pad" maxLength={40} />
        <Button title={busy ? 'Guardando…' : 'Guardar perfil'} onPress={saveProfile} disabled={busy} />
      </Card>}
      <Card>
        <Heading title="Seguridad" subtitle="La contraseña debe tener al menos 8 caracteres, una letra y un número." />
        {!mustChangePassword && <Field label="Contraseña actual" value={password.actual} onChangeText={updatePasswordField('actual')} secureTextEntry />}
        {mustChangePassword && <Field label="Contraseña temporal actual" value={password.actual} onChangeText={updatePasswordField('actual')} secureTextEntry />}
        <Field label="Nueva contraseña" value={password.nueva} onChangeText={updatePasswordField('nueva')} secureTextEntry />
        {!!error && <Message>{error}</Message>}
        {!!success && <Message type="success">{success}</Message>}
        <Button title={busy ? 'Actualizando…' : 'Actualizar contraseña'} onPress={submitPassword} disabled={busy || !password.actual || !password.nueva} />
      </Card>
    </MotionScrollView>
  );
}
