import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export const colors = {
  background: '#f4f7fb',
  surface: '#ffffff',
  primary: '#1769aa',
  primaryDark: '#124c7b',
  text: '#172b3a',
  muted: '#647887',
  border: '#dce5ec',
  danger: '#b42318',
  green: '#15803d',
  amber: '#a15c00',
};

export function Button({ title, onPress, variant = 'primary', disabled = false, small = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'danger' && styles.buttonDanger,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.buttonText, variant !== 'primary' && styles.buttonTextDark]}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, maxLength }) {
  return (
    <View style={styles.field}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8798a5"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        maxLength={maxLength}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Heading({ title, subtitle }) {
  return (
    <View style={styles.heading}>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

export function Message({ children, type = 'error' }) {
  return (
    <View style={[styles.message, type === 'success' ? styles.successMessage : null]}>
      <Text style={[styles.messageText, type === 'success' ? styles.successText : null]}>{children}</Text>
    </View>
  );
}

export function Loading({ label = 'Cargando…' }) {
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>{label}</Text></View>;
}

export function Empty({ children }) {
  return <Text style={styles.empty}>{children}</Text>;
}

export function formatDate(value) {
  return value ? new Date(value).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' }) : '—';
}

export function fullName(user) {
  return [user?.nombre, user?.apellido].filter(Boolean).join(' ') || 'Usuario';
}

export function statusLabel(status) {
  return ({
    pendiente: 'Pendiente',
    asignada: 'Asignada',
    en_proceso: 'En proceso',
    esperando_cliente: 'Espera tu respuesta',
    finalizada: 'Finalizada',
    cancelada: 'Cancelada',
  })[status] || status;
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 18 },
  content: { paddingTop: 16, paddingBottom: 36, gap: 14 },
  card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  heading: { gap: 4, marginBottom: 4 },
  title: { color: colors.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  button: { minHeight: 46, backgroundColor: colors.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  buttonSmall: { minHeight: 38, paddingHorizontal: 12 },
  buttonSecondary: { backgroundColor: '#eaf2f8', borderWidth: 1, borderColor: colors.border },
  buttonDanger: { backgroundColor: '#fff0ef', borderWidth: 1, borderColor: '#f1c2bd' },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.78 },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  buttonTextDark: { color: colors.text },
  field: { gap: 6 },
  label: { color: colors.text, fontWeight: '700', fontSize: 14 },
  input: { minHeight: 46, backgroundColor: '#ffffff', borderColor: colors.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: colors.text, fontSize: 16 },
  multiline: { minHeight: 104, textAlignVertical: 'top' },
  message: { padding: 12, backgroundColor: '#fff0ef', borderColor: '#f1c2bd', borderWidth: 1, borderRadius: 10 },
  messageText: { color: colors.danger, lineHeight: 20 },
  successMessage: { backgroundColor: '#eefbf1', borderColor: '#bfe3c7' },
  successText: { color: colors.green },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  loading: { padding: 22, alignItems: 'center', gap: 10 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 22, lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  spaceBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  itemTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  itemMeta: { color: colors.muted, fontSize: 13 },
  status: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
  statNumber: { color: colors.primaryDark, fontSize: 25, fontWeight: '800' },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
});
