import React from 'react';
import { ActivityIndicator, Animated, Image, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
    incomingMessage: '#ffffff',
    outgoingMessage: '#d8f6e8',
    outgoingText: '#183b32',
    composerSurface: '#f5f8fa',
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
    incomingMessage: '#1d303e',
    outgoingMessage: '#075e54',
    outgoingText: '#e8f5f1',
    composerSurface: '#172936',
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

const KeyboardScrollContext = React.createContext(null);

export const MotionScrollView = React.forwardRef(function MotionScrollView(
  { children, contentContainerStyle, onScroll, scrollEventThrottle = 16, ...props },
  ref,
) {
  const scrollY = React.useRef(new Animated.Value(0)).current;
  const scrollViewRef = React.useRef(null);
  const focusedInputRef = React.useRef(false);
  const keyboardScrollTimer = React.useRef(null);
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);
  const setScrollViewRef = React.useCallback((instance) => {
    scrollViewRef.current = instance;
    if (typeof ref === 'function') ref(instance);
    else if (ref) ref.current = instance;
  }, [ref]);
  const scrollToEndAfterKeyboard = React.useCallback((repeatAfterLayout = false) => {
    clearTimeout(keyboardScrollTimer.current);
    keyboardScrollTimer.current = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
      if (repeatAfterLayout) {
        keyboardScrollTimer.current = setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 120);
      }
    }, Platform.OS === 'android' ? 320 : 100);
  }, []);
  const onInputFocus = React.useCallback(() => {
    focusedInputRef.current = true;
    scrollToEndAfterKeyboard();
  }, [scrollToEndAfterKeyboard]);
  const onInputBlur = React.useCallback(() => {
    focusedInputRef.current = false;
    clearTimeout(keyboardScrollTimer.current);
  }, []);
  React.useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardVisible(true);
      if (!focusedInputRef.current) return;
      Keyboard.scheduleLayoutAnimation(event);
      scrollToEndAfterKeyboard(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      clearTimeout(keyboardScrollTimer.current);
    };
  }, [scrollToEndAfterKeyboard]);
  const keyboardScroll = React.useMemo(
    () => ({ onInputFocus, onInputBlur }),
    [onInputBlur, onInputFocus],
  );
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
    <KeyboardScrollContext.Provider value={keyboardScroll}>
      <Animated.ScrollView
        {...props}
        ref={setScrollViewRef}
        contentContainerStyle={[contentContainerStyle, keyboardVisible && { paddingBottom: 180 }]}
        scrollEventThrottle={scrollEventThrottle}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true, listener: onScroll },
        )}
      >
        {content[0] && <Animated.View style={headerStyle}>{content[0]}</Animated.View>}
        {content.slice(1)}
      </Animated.ScrollView>
    </KeyboardScrollContext.Provider>
  );
});

export function useKeyboardScroll() {
  return React.useContext(KeyboardScrollContext);
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

export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, maxLength, onFocus, onBlur }) {
  const revealFocusedInput = React.useContext(KeyboardScrollContext);
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
        onFocus={(event) => {
          revealFocusedInput?.onInputFocus();
          onFocus?.(event);
        }}
        onBlur={(event) => {
          revealFocusedInput?.onInputBlur();
          onBlur?.(event);
        }}
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
  adminPageHeading: { gap: 2 },
  adminPageEyebrow: { color: colors.primaryDark, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  adminTabList: { gap: 8, paddingVertical: 2 },
  adminTab: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  adminTabActive: { backgroundColor: colors.tabActive, borderColor: colors.primary },
  adminTabIcon: { color: colors.muted, fontSize: 14, fontWeight: '800' },
  adminTabText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  adminTabTextActive: { color: colors.primaryDark },
  adminHero: { backgroundColor: colors.primaryDark, borderRadius: 24, padding: 20, gap: 18 },
  adminHeroEyebrow: { color: colors.textOnPrimary, opacity: 0.78, fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  adminHeroTitle: { color: colors.textOnPrimary, fontSize: 27, fontWeight: '900', letterSpacing: -0.6 },
  adminHeroSubtitle: { color: colors.textOnPrimary, opacity: 0.84, fontSize: 13, lineHeight: 18 },
  adminHeroBadge: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)' },
  adminHeroBadgeText: { color: colors.textOnPrimary, fontSize: 25, fontWeight: '800' },
  adminHeroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.22)' },
  adminHeroMetrics: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  adminHeroMetric: { flex: 1, gap: 3 },
  adminHeroMetricValue: { color: colors.textOnPrimary, fontSize: 23, fontWeight: '900' },
  adminHeroMetricLabel: { color: colors.textOnPrimary, opacity: 0.8, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  adminHeroMetricDivider: { width: 1, height: 34, backgroundColor: 'rgba(255,255,255,0.22)', marginHorizontal: 10 },
  adminSectionTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  adminRefresh: { color: colors.primaryDark, fontSize: 13, fontWeight: '800', padding: 4 },
  adminStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  adminStatCard: { flexBasis: '47%', flexGrow: 1, minWidth: 132, padding: 14, gap: 7 },
  adminStatIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.secondarySurface },
  adminStatIconText: { fontSize: 17, fontWeight: '900' },
  adminStatAccent: { width: 7, height: 7, borderRadius: 4 },
  adminStatValue: { color: colors.text, fontSize: 25, fontWeight: '900', letterSpacing: -0.5 },
  adminProgressCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 16, gap: 14 },
  adminProgressPercent: { color: colors.primaryDark, fontSize: 20, fontWeight: '900' },
  adminProgressTrack: { height: 9, overflow: 'hidden', borderRadius: 5, backgroundColor: colors.secondarySurface },
  adminProgressFill: { height: '100%', borderRadius: 5, backgroundColor: colors.accent },
  adminSectionHeading: { gap: 3, marginTop: 2 },
  adminActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  adminAction: { flexBasis: '47%', flexGrow: 1, minWidth: 132, minHeight: 128, justifyContent: 'space-between', padding: 14, borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  adminActionIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.tabActive },
  adminActionIconText: { color: colors.primaryDark, fontSize: 18, fontWeight: '900' },
  adminActionArrow: { color: colors.primaryDark, fontSize: 25, fontWeight: '500' },
  adminActionTitle: { color: colors.text, fontSize: 15, fontWeight: '800', marginTop: 10 },
  adminActionSubtitle: { color: colors.muted, fontSize: 12, lineHeight: 17 },
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
  chatCard: { padding: 12, gap: 12 },
  chatHeader: { paddingHorizontal: 4, paddingBottom: 2 },
  chatMessages: { maxHeight: 380, minHeight: 150, borderRadius: 16, padding: 10, gap: 8 },
  chatEmpty: { flex: 1, minHeight: 130, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  chatEmptyTitle: { color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  chatEmptySubtitle: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 4 },
  messageRow: { width: '100%', flexDirection: 'row' },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '88%', borderRadius: 16, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 7, gap: 3 },
  messageBubbleOwn: { backgroundColor: colors.outgoingMessage, borderTopRightRadius: 5 },
  messageBubbleOther: { backgroundColor: colors.incomingMessage, borderTopLeftRadius: 5 },
  messageAuthor: { color: colors.primaryDark, fontSize: 11, fontWeight: '800' },
  messageText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  messageTextOwn: { color: colors.outgoingText },
  messageTime: { color: colors.muted, fontSize: 10, textAlign: 'right', marginTop: 1 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 6, backgroundColor: colors.composerSurface, borderRadius: 25 },
  composerInput: { flex: 1, maxHeight: 120, minHeight: 42, borderRadius: 21, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 9, color: colors.text, fontSize: 15, lineHeight: 21 },
  sendButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  sendButtonDisabled: { opacity: 0.45 },
  sendButtonText: { color: colors.textOnPrimary, fontSize: 20, fontWeight: '800', marginLeft: 2 },
  chatClosed: { textAlign: 'center', color: colors.muted, fontSize: 13, lineHeight: 18, paddingHorizontal: 8 },
  };
}

setThemeMode('light');
