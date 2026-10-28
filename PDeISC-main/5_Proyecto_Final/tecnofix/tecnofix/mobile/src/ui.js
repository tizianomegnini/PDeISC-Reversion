import React from 'react';
import { ActivityIndicator, Animated, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const palettes = {
  light: {
    background: '#f3f6fa',
    surface: '#ffffff',
    surfaceSoft: '#fbfdfe',
    primary: '#087e8b',
    primaryDark: '#105264',
    accent: '#20c5a3',
    text: '#142a3a',
    muted: '#617787',
    border: '#dbe5eb',
    secondarySurface: '#edf5f5',
    secondaryBorder: '#d5e7e7',
    danger: '#b42318',
    dangerSurface: '#fff0ef',
    dangerBorder: '#f1c2bd',
    green: '#15803d',
    successSurface: '#eefbf1',
    successBorder: '#bfe3c7',
    successText: '#15803d',
    amber: '#a15c00',
    messageSurface: '#fff0ef',
    tabActive: '#edf7f6',
    placeholder: '#8798a5',
    textOnPrimary: '#ffffff',
    shadow: '#102a43',
    conversationSurface: '#f0f6fb',
    rating: '#e5a000',
    ratingEmpty: '#a9b5bd',
  },
  dark: {
    background: '#0b1620',
    surface: '#132331',
    surfaceSoft: '#182b3b',
    primary: '#27b4aa',
    primaryDark: '#66d9c7',
    accent: '#20c5a3',
    text: '#edf5f7',
    muted: '#9db1bd',
    border: '#283d4c',
    secondarySurface: '#1c3341',
    secondaryBorder: '#315161',
    danger: '#ff9a91',
    dangerSurface: '#3b2528',
    dangerBorder: '#61353a',
    green: '#5ed39a',
    successSurface: '#163528',
    successBorder: '#24533c',
    successText: '#80dda8',
    amber: '#ffc66d',
    messageSurface: '#3a2528',
    tabActive: '#1d3c47',
    placeholder: '#8197a5',
    textOnPrimary: '#092630',
    shadow: '#000000',
    conversationSurface: '#1a3040',
    rating: '#ffc247',
    ratingEmpty: '#5b6d79',
  },
};

const THEME_STORAGE_KEY = 'tecnofix-color-theme';
let activeTheme = 'light';
export let colors = palettes[activeTheme];
let themedStyles = {};

export function setThemeMode(mode) {
  activeTheme = mode === 'dark' ? 'dark' : 'light';
  colors = palettes[activeTheme];
  themedStyles = StyleSheet.create(createStyles());
  return activeTheme;
}

export function getThemeMode() {
  return activeTheme;
}

export async function restoreThemeMode() {
  const savedTheme = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
  return savedTheme === 'dark' ? 'dark' : 'light';
}

export async function saveThemeMode(mode) {
  await SecureStore.setItemAsync(THEME_STORAGE_KEY, mode);
}

export const styles = new Proxy({}, {
  get(_target, key) {
    return themedStyles[key];
  },
});

export function MotionScrollView({ children, onScroll, scrollEventThrottle = 16, ...props }) {
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const content = React.Children.toArray(children);
  const headerStyle = {
    opacity: scrollY.interpolate({
      inputRange: [0, 100, 220],
      outputRange: [1, 0.97, 0.93],
      extrapolate: 'clamp',
    }),
    transform: [{
      translateY: scrollY.interpolate({
        inputRange: [0, 180],
        outputRange: [0, -9],
        extrapolate: 'clamp',
      }),
    }],
  };

  return (
    <Animated.ScrollView
      {...props}
      scrollEventThrottle={scrollEventThrottle}
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true, listener: onScroll },
      )}
    >
      {content[0] && <Animated.View style={headerStyle}>{content[0]}</Animated.View>}
      {content.slice(1)}
    </Animated.ScrollView>
  );
}

export function BrandMark({ size = 44 }) {
  return <Image source={require('../assets/tecnofix-mark.png')} style={{ width: size, height: size }} resizeMode="contain" />;
}

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
        placeholderTextColor={colors.placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        maxLength={maxLength}
        autoCapitalize={keyboardType === 'email-address' || secureTextEntry ? 'none' : 'sentences'}
        autoCorrect={keyboardType === 'email-address' || secureTextEntry ? false : undefined}
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

function createStyles() {
  return {
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: 18 },
  screenContainer: { flex: 1, paddingHorizontal: 16 },
  content: { paddingTop: 18, paddingBottom: 28, gap: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  heading: { gap: 6, marginBottom: 4 },
  title: { color: colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21 },
  button: { minHeight: 52, backgroundColor: colors.primary, borderRadius: 14, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 },
  buttonSmall: { minHeight: 42, paddingHorizontal: 14 },
  buttonSecondary: { backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.secondaryBorder },
  buttonDanger: { backgroundColor: colors.dangerSurface, borderWidth: 1, borderColor: colors.dangerBorder },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { opacity: 0.78 },
  buttonText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 15 },
  buttonTextDark: { color: colors.text },
  field: { gap: 7 },
  label: { color: colors.text, fontWeight: '700', fontSize: 14 },
  input: { minHeight: 50, backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 11, color: colors.text, fontSize: 16 },
  multiline: { minHeight: 104, textAlignVertical: 'top' },
  message: { padding: 12, backgroundColor: colors.messageSurface, borderColor: colors.dangerBorder, borderWidth: 1, borderRadius: 10 },
  messageText: { color: colors.danger, lineHeight: 20 },
  successMessage: { backgroundColor: colors.successSurface, borderColor: colors.successBorder },
  successText: { color: colors.successText },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  loading: { flex: 1, padding: 22, alignItems: 'center', justifyContent: 'center', gap: 10 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 22, lineHeight: 21 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  spaceBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  itemTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  itemMeta: { color: colors.muted, fontSize: 13 },
  status: { color: colors.primaryDark, fontWeight: '700', fontSize: 13 },
  statNumber: { color: colors.primaryDark, fontSize: 25, fontWeight: '800' },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  authContainer: { flexGrow: 1, paddingHorizontal: 20, justifyContent: 'center', paddingVertical: 28, gap: 22 },
  authBrand: { alignItems: 'center', gap: 8 },
  authBrandName: { color: colors.text, fontSize: 29, fontWeight: '900', letterSpacing: -0.8 },
  authBrandSubtitle: { color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  authCard: { padding: 20, borderRadius: 24, gap: 14 },
  appHeader: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerBrandName: { color: colors.text, fontSize: 17, fontWeight: '900', letterSpacing: -0.3 },
  headerBrandSubtitle: { color: colors.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.1, marginTop: 1 },
  headerIdentity: { alignItems: 'flex-end', flexShrink: 1, marginLeft: 8 },
  headerUser: { color: colors.text, fontSize: 13, fontWeight: '700', maxWidth: 116 },
  headerRole: { color: colors.primaryDark, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  headerLogout: { marginLeft: 8, minHeight: 42, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.dangerSurface },
  headerLogoutText: { color: colors.danger, fontSize: 12, fontWeight: '800' },
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 5 },
  tab: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 14 },
  tabActive: { backgroundColor: colors.tabActive },
  tabIcon: { color: colors.muted, fontSize: 19, lineHeight: 23, fontWeight: '700' },
  tabIconActive: { color: colors.primary },
  tabLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  tabLabelActive: { color: colors.primaryDark },
  themeButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.secondarySurface, borderWidth: 1, borderColor: colors.secondaryBorder },
  themeButtonText: { color: colors.primaryDark, fontSize: 19, fontWeight: '800' },
  themeOptions: { flexDirection: 'row', gap: 10 },
  themeOption: { flex: 1 },
  };
}

setThemeMode('light');
