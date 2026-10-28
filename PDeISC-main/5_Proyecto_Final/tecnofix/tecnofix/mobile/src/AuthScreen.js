import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { authApi, getOAuthRedirectUri, saveToken } from './api';
import { Button, Card, Field, Heading, Message, styles } from './ui';

const socialProviders = [
  { id: 'google', label: 'Continuar con Google' },
  { id: 'facebook', label: 'Continuar con Facebook' },
  { id: 'github', label: 'Continuar con GitHub' },
];

const socialErrorMessage = (code) => ({
  account_unavailable: 'La cuenta está desactivada o no está disponible.',
  account_provider_mismatch: 'Esta cuenta ya está vinculada a otro método de inicio de sesión.',
  github_account_exists: 'Ya existe una cuenta con ese email y no se puede vincular automáticamente.',
  google_email_unverified: 'Google no confirmó que el email de la cuenta esté verificado.',
  google_email_missing: 'Google no proporcionó un email para esta cuenta.',
  facebook_email_missing: 'Facebook no proporcionó un email para esta cuenta.',
  github_email_missing: 'GitHub no proporcionó un email verificado para esta cuenta.',
  google_cancelled: 'Se canceló el inicio de sesión con Google.',
  facebook_cancelled: 'Se canceló el inicio de sesión con Facebook.',
  github_cancelled: 'Se canceló el inicio de sesión con GitHub.',
}[code] || 'No se pudo completar el inicio de sesión social. Intentá nuevamente.');

export default function AuthScreen({ onSession, initialError = '' }) {
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const update = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const signInWithProvider = async (provider) => {
    setError('');
    setBusy(true);
    try {
      const redirectUri = getOAuthRedirectUri();
      const result = await WebBrowser.openAuthSessionAsync(
        authApi.socialLoginUrl(provider, redirectUri),
        redirectUri,
      );
      if (result.type !== 'success') return;

      const { queryParams } = Linking.parse(result.url);
      if (typeof queryParams?.error === 'string') {
        setError(socialErrorMessage(queryParams.error));
        return;
      }
      if (typeof queryParams?.code !== 'string') {
        throw new Error('El proveedor no devolvió un código de inicio de sesión.');
      }

      const session = await authApi.exchangeMobileCode(queryParams.code);
      if (!session.token) throw new Error('El servidor no devolvió el token de sesión móvil. Revisá el backend desplegado.');
      await saveToken(session.token);
      onSession(session.usuario);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      const result = registering ? await authApi.register(form) : await authApi.login(form);
      if (!result.token) throw new Error('El servidor no devolvió el token de sesión móvil. Revisá el backend desplegado.');
      await saveToken(result.token);
      onSession(result.usuario);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.container, { justifyContent: 'center', paddingVertical: 28 }]} keyboardShouldPersistTaps="handled">
        <Card>
          <Text style={{ color: '#1769aa', fontWeight: '800', letterSpacing: 2 }}>TECNOfIX · SOPORTE</Text>
          <Heading title={registering ? 'Crear cuenta' : 'Bienvenido/a'} subtitle={registering ? 'Registrate como cliente para solicitar soporte técnico.' : 'Ingresá para consultar o dar seguimiento a tus casos.'} />
          {registering && <>
            <Field label="Nombre" value={form.nombre} onChangeText={update('nombre')} maxLength={80} />
            <Field label="Apellido" value={form.apellido} onChangeText={update('apellido')} maxLength={80} />
            <Field label="Teléfono (opcional)" value={form.telefono} onChangeText={update('telefono')} keyboardType="phone-pad" maxLength={40} />
          </>}
          <Field label="Email" value={form.email} onChangeText={update('email')} keyboardType="email-address" />
          <Field label="Contraseña" value={form.password} onChangeText={update('password')} secureTextEntry />
          {!!error && <Message>{error}</Message>}
          <Button title={busy ? 'Un momento…' : registering ? 'Crear cuenta' : 'Ingresar'} onPress={submit} disabled={busy} />
          <Button title={registering ? 'Ya tengo una cuenta' : 'Registrarme como cliente'} onPress={() => { setError(''); setRegistering((value) => !value); }} variant="secondary" disabled={busy} />
          {!registering && <>
            <Text style={[styles.muted, { textAlign: 'center', paddingTop: 4 }]}>O ingresá con</Text>
            {socialProviders.map(({ id, label }) => (
              <Button key={id} title={label} onPress={() => signInWithProvider(id)} variant="secondary" disabled={busy} />
            ))}
          </>}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
