import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, ScrollView,
  SafeAreaView, StatusBar, Platform, Alert, Linking, ActivityIndicator,
} from 'react-native';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import jsQR from 'jsqr';
import jpeg from 'jpeg-js';
import { toByteArray } from 'base64-js';
import * as Location from 'expo-location';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as LocalAuthentication from 'expo-local-authentication';

const C = {
  bg: '#F3F5FB', ink: '#151B36', mute: '#737B96', card: '#FFFFFF',
  accent: '#5865E8', accentDark: '#434FCB', cyan: '#2CC9D2',
  ok: '#178A68', bad: '#D34C62', line: '#E5E8F2', navy: '#171D3B',
};

const TABS = [
  { id: 'camera', label: 'Cámara', icon: '◉' },
  { id: 'scan', label: 'Escáner', icon: '⌗' },
  { id: 'gps', label: 'Ubicación', icon: '◎' },
  { id: 'motion', label: 'Movimiento', icon: '⌁' },
  { id: 'bio', label: 'Biometría', icon: '◈' },
];

/* ---------- Componentes base ---------- */
const Btn = ({ title, onPress, kind = 'primary', style, disabled = false }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.82}
    disabled={disabled}
    accessibilityRole="button"
    style={[s.btn, kind === 'ghost' && s.btnGhost, kind === 'dark' && s.btnDark, disabled && s.btnDisabled, style]}
  >
    <Text style={[s.btnText, kind === 'ghost' && { color: C.accent }, kind === 'dark' && { color: '#fff' }]}>{title}</Text>
  </TouchableOpacity>
);

const PermissionGate = ({ permission, request, children, what }) => {
  if (!permission) return <Text style={s.mute}>Comprobando permisos…</Text>;
  if (!permission.granted) {
    return (
      <View style={s.card}>
        <Text style={s.h2}>Necesitamos acceso a {what}</Text>
        <Text style={s.mute}>Con este permiso vas a poder usar la función desde la app.</Text>
        <Btn title="Dar permiso" onPress={request} style={{ marginTop: 12 }} />
        {!permission.canAskAgain && (
          <Btn title="Abrir ajustes" kind="ghost" onPress={() => Linking.openSettings()} style={{ marginTop: 8 }} />
        )}
      </View>
    );
  }
  return children;
};

/* ---------- Cámara ---------- */
function CameraScreen() {
  const [perm, request] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [photo, setPhoto] = useState(null);
  const ref = useRef(null);

  const take = async () => {
    try {
      const p = await ref.current?.takePictureAsync({ quality: 0.6 });
      if (p?.uri) setPhoto(p.uri);
    } catch (e) {
      Alert.alert('No se pudo tomar la foto', String(e.message || e));
    }
  };

  return (
    <PermissionGate permission={perm} request={request} what="la cámara">
      <View style={s.cameraBox}>
        <CameraView ref={ref} style={StyleSheet.absoluteFill} facing={facing} />
      </View>
      <View style={s.row}>
        <Btn title="Tomar foto" onPress={take} style={{ flex: 1 }} />
        <Btn title="Girar cámara" kind="ghost" onPress={() => setFacing(f => (f === 'back' ? 'front' : 'back'))} style={{ flex: 1 }} />
      </View>
      {photo && (
        <View style={s.card}>
          <Text style={s.h2}>Última foto</Text>
          <Image source={{ uri: photo }} style={s.preview} />
        </View>
      )}
    </PermissionGate>
  );
}

async function readQrFromImage(uri) {
  const image = await ImageManipulator.ImageManipulator.manipulate(uri, { maxWidth: 1800, maxHeight: 1800 }).renderAsync();
  const jpegImage = await image.saveAsync({ format: ImageManipulator.SaveFormat.JPEG, base64: true });
  if (!jpegImage.base64) throw new Error('No se pudo preparar la imagen para leer el QR.');
  const decoded = jpeg.decode(toByteArray(jpegImage.base64), { useTArray: true, maxMemoryUsageInMB: 128, maxResolutionInMP: 8 });
  const pixels = new Uint8ClampedArray(decoded.data.buffer, decoded.data.byteOffset, decoded.data.byteLength);
  return jsQR(pixels, decoded.width, decoded.height, { inversionAttempts: 'attemptBoth' });
}

function ScanScreen() {
  const [perm, request] = useCameraPermissions();
  const [result, setResult] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef(null);
  const locked = useRef(false);

  const scanImage = async (uri, source) => {
    locked.current = false;
    setResult(null);
    setBusy(true);
    try {
      const code = await readQrFromImage(uri);
      if (code?.data) {
        locked.current = true;
        setResult({ type: 'qr', data: code.data, source });
      } else {
        Alert.alert('No encontramos un QR', 'Probá con una imagen más nítida, mejor iluminada y con el código ocupando buena parte de la imagen.');
      }
    } catch (e) {
      Alert.alert('No se pudo analizar la imagen', String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  const scanCamera = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 1, skipProcessing: false });
      if (!photo?.uri) throw new Error('No se pudo capturar la imagen de la cámara.');
      await scanImage(photo.uri, 'Cámara');
    } catch (e) {
      Alert.alert('No se pudo analizar la imagen', String(e.message || e));
      setBusy(false);
    }
  };

  const pickImage = async () => {
    try {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      if (picked.canceled || !picked.assets?.[0]?.uri) return;
      setImageUri(picked.assets[0].uri);
      await scanImage(picked.assets[0].uri, 'Imagen de la galería');
    } catch (e) {
      Alert.alert('No se pudo analizar la imagen', String(e.message || e));
    }
  };
  const reset = () => { locked.current = false; setResult(null); setImageUri(null); };

  return (
    <View>
      <View style={s.scanActions}>
        <Btn title="Elegir imagen" onPress={pickImage} disabled={busy} style={s.scanAction} />
        {(result || imageUri) && <Btn title="Limpiar" kind="ghost" onPress={reset} style={s.scanAction} />}
      </View>
      {imageUri ? (
        <View style={s.imageScanBox}>
          <Image source={{ uri: imageUri }} style={s.imageScanPreview} resizeMode="contain" />
          {busy && <View style={s.imageScanBusy}><ActivityIndicator color="#fff" /><Text style={s.imageScanBusyText}>Buscando QR…</Text></View>}
        </View>
      ) : (
        <PermissionGate permission={perm} request={request} what="la cámara">
          <View style={s.cameraBox}>
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" mute={true} />
            <View style={s.frame} pointerEvents="none" />
            <View style={s.cameraHint}><Text style={s.cameraHintText}>Enfocá el QR y tocá «Leer QR»</Text></View>
          </View>
          <Btn title={busy ? 'Analizando…' : 'Leer QR'} onPress={scanCamera} disabled={busy} style={{ marginTop: 12 }} />
        </PermissionGate>
      )}
      <View style={s.card}>
        {result ? (
          <>
            <Text style={s.eyebrow}>LECTURA COMPLETADA · {result.source}</Text>
            <Text style={s.h2}>Código QR leído</Text>
            <Text selectable style={s.value}>{result.data}</Text>
            <View style={s.row}>
              {/^https?:\/\//i.test(result.data) && <Btn title="Abrir enlace" onPress={() => Linking.openURL(result.data)} style={{ flex: 1 }} />}
              <Btn title="Escanear otro" kind="ghost" onPress={reset} style={{ flex: 1 }} />
            </View>
          </>
        ) : (
          <>
            <Text style={s.h2}>Escaneá un código</Text>
            <Text style={s.mute}>Enfocá el QR y tocá «Leer QR», o elegí una foto de la galería.</Text>
          </>
        )}
      </View>
    </View>
  );
}
/* ---------- Ubicación ---------- */
function GpsScreen() {
  const [pos, setPos] = useState(null);
  const [err, setErr] = useState(null);
  const [watching, setWatching] = useState(false);
  const sub = useRef(null);

  const ensure = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setErr('Permiso de ubicación denegado.'); return false; }
    setErr(null); return true;
  };

  const once = async () => {
    if (!(await ensure())) return;
    try {
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setPos(p);
    } catch { setErr('No se pudo obtener la ubicación. ¿Está el GPS activado?'); }
  };

  const toggle = async () => {
    if (watching) { sub.current?.remove(); sub.current = null; setWatching(false); return; }
    if (!(await ensure())) return;
    sub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 2, timeInterval: 1000 },
      setPos
    );
    setWatching(true);
  };

  useEffect(() => () => sub.current?.remove(), []);

  const c = pos?.coords;
  const mapUrl = c ? `https://www.google.com/maps?q=${c.latitude},${c.longitude}` : null;

  return (
    <View>
      <View style={s.row}>
        <Btn title="Ubicación actual" onPress={once} style={{ flex: 1 }} />
        <Btn title={watching ? 'Detener' : 'Seguir'} kind="ghost" onPress={toggle} style={{ flex: 1 }} />
      </View>
      {err && <Text style={[s.mute, { color: C.bad, marginTop: 8 }]}>{err}</Text>}
      <View style={s.card}>
        {c ? (
          <>
            <Row k="Latitud" v={c.latitude.toFixed(6)} />
            <Row k="Longitud" v={c.longitude.toFixed(6)} />
            <Row k="Precisión" v={`${Math.round(c.accuracy ?? 0)} m`} />
            <Row k="Altitud" v={c.altitude != null ? `${Math.round(c.altitude)} m` : '—'} />
            <Row k="Velocidad" v={c.speed != null && c.speed >= 0 ? `${(c.speed * 3.6).toFixed(1)} km/h` : '—'} />
            <Btn title="Ver en Google Maps" kind="ghost" onPress={() => Linking.openURL(mapUrl)} style={{ marginTop: 12 }} />
          </>
        ) : (
          <Text style={s.mute}>Todavía no hay datos de ubicación.</Text>
        )}
      </View>
    </View>
  );
}

/* ---------- Acelerómetro y giroscopio ---------- */
const Axis = ({ label, value, max }) => {
  const pct = Math.min(Math.abs(value) / max, 1) * 50;
  return (
    <View style={s.axis}>
      <Text style={s.axisLabel}>{label}</Text>
      <View style={s.track}>
        <View style={[s.fill, value >= 0 ? { left: '50%', width: `${pct}%` } : { right: '50%', width: `${pct}%` }]} />
        <View style={s.zero} />
      </View>
      <Text style={s.axisVal}>{value.toFixed(2)}</Text>
    </View>
  );
};

function MotionScreen() {
  const [acc, setAcc] = useState({ x: 0, y: 0, z: 0 });
  const [gyr, setGyr] = useState({ x: 0, y: 0, z: 0 });
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);
    const a = Accelerometer.addListener(setAcc);
    const g = Gyroscope.addListener(setGyr);
    Promise.all([Accelerometer.isAvailableAsync(), Gyroscope.isAvailableAsync()])
      .then(([x, y]) => setAvailable(x && y));
    return () => { a.remove(); g.remove(); };
  }, []);

  const mag = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
  const shaking = mag > 2.2;

  return (
    <View>
      {!available && <Text style={[s.mute, { color: C.bad }]}>Este dispositivo no tiene todos los sensores.</Text>}
      <View style={s.card}>
        <Text style={s.h2}>Acelerómetro (g)</Text>
        <Axis label="X" value={acc.x} max={2} />
        <Axis label="Y" value={acc.y} max={2} />
        <Axis label="Z" value={acc.z} max={2} />
        <Text style={[s.value, shaking && { color: C.bad }]}>
          {shaking ? '¡Sacudida detectada!' : `Magnitud ${mag.toFixed(2)} g`}
        </Text>
      </View>
      <View style={s.card}>
        <Text style={s.h2}>Giroscopio (rad/s)</Text>
        <Axis label="X" value={gyr.x} max={4} />
        <Axis label="Y" value={gyr.y} max={4} />
        <Axis label="Z" value={gyr.z} max={4} />
      </View>
    </View>
  );
}

/* ---------- Biometría ---------- */
function BioScreen() {
  const [info, setInfo] = useState({ hw: null, enrolled: null, types: [] });
  const [status, setStatus] = useState(null);

  useEffect(() => {
    (async () => {
      const hw = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const t = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const names = { 1: 'Huella', 2: 'Rostro', 3: 'Iris' };
      setInfo({ hw, enrolled, types: t.map(x => names[x] || 'Otro') });
    })();
  }, []);

  const auth = async () => {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirmá tu identidad',
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar PIN',
    });
    setStatus(r.success ? 'ok' : `error: ${r.error || 'cancelado'}`);
  };

  return (
    <View>
      <View style={s.card}>
        <Row k="Hardware" v={info.hw == null ? '…' : info.hw ? 'Disponible' : 'No disponible'} />
        <Row k="Registrada" v={info.enrolled == null ? '…' : info.enrolled ? 'Sí' : 'No'} />
        <Row k="Tipos" v={info.types.join(', ') || '—'} />
      </View>
      <Btn title="Autenticar" onPress={auth} />
      {status && (
        <View style={[s.card, { borderColor: status === 'ok' ? C.ok : C.bad, borderWidth: 2 }]}>
          <Text style={[s.h2, { color: status === 'ok' ? C.ok : C.bad }]}>
            {status === 'ok' ? 'Acceso concedido' : 'Acceso denegado'}
          </Text>
          {status !== 'ok' && <Text style={s.mute}>{status}</Text>}
        </View>
      )}
    </View>
  );
}

const Row = ({ k, v }) => (
  <View style={s.kv}>
    <Text style={s.mute}>{k}</Text>
    <Text style={s.value}>{v}</Text>
  </View>
);

/* ---------- App ---------- */
export default function App() {
  const [tab, setTab] = useState('camera');
  const Screen = { camera: CameraScreen, scan: ScanScreen, gps: GpsScreen, motion: MotionScreen, bio: BioScreen }[tab];
  const activeTab = TABS.find(t => t.id === tab);
  const intro = {
    camera: ['Capturá el momento', 'Probá la cámara y guardá una foto al instante.'],
    scan: ['Leé códigos QR', 'Escaneá con la cámara o analizá una imagen guardada.'],
    gps: ['Tu ubicación', 'Consultá coordenadas y precisión en tiempo real.'],
    motion: ['Sentí el movimiento', 'Explorá los datos del acelerómetro y el giroscopio.'],
    bio: ['Acceso biométrico', 'Comprobá las opciones de seguridad de tu dispositivo.'],
  }[tab];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={s.header}>
        <Image source={require('./assets/icon.png')} style={s.brandLogo} />
        <View style={s.brandText}>
          <Text style={s.title}>RN2</Text>
          <Text style={s.brandSubtitle}>LABORATORIO DE SENSORES</Text>
        </View>
        <View style={s.livePill}><View style={s.liveDot} /><Text style={s.liveText}>EN VIVO</Text></View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={[s.tab, tab === t.id && s.tabOn]} accessibilityRole="button" accessibilityState={{ selected: tab === t.id }}>
            <Text style={[s.tabIcon, tab === t.id && { color: C.cyan }]}>{t.icon}</Text>
            <Text style={[s.tabText, tab === t.id && { color: '#fff' }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={s.body}>
        <View style={s.intro}>
          <Text style={s.eyebrow}>EXPLORAR · {activeTab?.label.toUpperCase()}</Text>
          <Text style={s.introTitle}>{intro[0]}</Text>
          <Text style={s.introText}>{intro[1]}</Text>
        </View>
        <Screen key={tab} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  brandLogo: { width: 48, height: 48, borderRadius: 15, backgroundColor: C.navy },
  brandText: { flex: 1, marginLeft: 12 },
  title: { fontSize: 24, lineHeight: 27, fontWeight: '900', color: C.ink, letterSpacing: 0.6 },
  brandSubtitle: { marginTop: 3, fontSize: 9, fontWeight: '800', letterSpacing: 1.35, color: C.mute },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#E6F7F4' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.ok },
  liveText: { color: C.ok, fontWeight: '800', fontSize: 9, letterSpacing: 0.6 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingBottom: 12 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 15, backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  tabOn: { backgroundColor: C.navy, borderColor: C.navy },
  tabIcon: { color: C.accent, fontSize: 16, fontWeight: '800' },
  tabText: { fontSize: 12, fontWeight: '700', color: C.ink },
  body: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 42, gap: 14 },
  intro: { paddingVertical: 4, paddingHorizontal: 2, marginBottom: 2 },
  eyebrow: { color: C.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.25, marginBottom: 7 },
  introTitle: { fontSize: 25, lineHeight: 30, fontWeight: '900', color: C.ink, letterSpacing: -0.5 },
  introText: { marginTop: 5, fontSize: 13, lineHeight: 19, color: C.mute },
  card: { backgroundColor: C.card, borderRadius: 20, padding: 17, marginTop: 12, borderWidth: 1, borderColor: C.line, shadowColor: '#26345C', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 2 },
  h2: { fontSize: 16, fontWeight: '800', color: C.ink, marginBottom: 6 },
  mute: { color: C.mute, fontSize: 13, lineHeight: 19 },
  value: { color: C.ink, fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 6 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.line },
  row: { flexDirection: 'row', gap: 10, marginTop: 13 },
  btn: { backgroundColor: C.accent, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.accent, shadowColor: C.accent, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 9, elevation: 2 },
  btnGhost: { backgroundColor: '#F5F6FC', borderColor: C.line, shadowOpacity: 0, elevation: 0 },
  btnDark: { backgroundColor: C.navy, borderColor: C.navy },
  btnDisabled: { opacity: 0.65 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  scanActions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  scanAction: { flex: 1 },
  cameraBox: { height: 340, borderRadius: 22, overflow: 'hidden', backgroundColor: '#090D1B' },
  frame: { position: 'absolute', top: '23%', left: '15%', right: '15%', bottom: '23%', borderWidth: 2, borderColor: '#fff', borderRadius: 20, backgroundColor: 'transparent' },
  cameraHint: { position: 'absolute', bottom: 15, alignSelf: 'center', borderRadius: 20, backgroundColor: 'rgba(12,16,34,0.72)', paddingHorizontal: 14, paddingVertical: 8 },
  cameraHintText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  imageScanBox: { height: 300, borderRadius: 22, overflow: 'hidden', backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  imageScanPreview: { width: '100%', height: '100%' },
  imageScanBusy: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,19,42,0.68)', alignItems: 'center', justifyContent: 'center', gap: 10 },
  imageScanBusyText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  preview: { width: '100%', height: 220, borderRadius: 14, marginTop: 8, backgroundColor: C.bg },
  axis: { flexDirection: 'row', alignItems: 'center', marginVertical: 7 },
  axisLabel: { width: 18, color: C.mute, fontWeight: '800' },
  axisVal: { width: 56, textAlign: 'right', color: C.ink, fontVariant: ['tabular-nums'], fontWeight: '700' },
  track: { flex: 1, height: 10, backgroundColor: C.bg, borderRadius: 5, overflow: 'hidden', marginHorizontal: 8 },
  fill: { position: 'absolute', top: 0, bottom: 0, backgroundColor: C.accent },
  zero: { position: 'absolute', left: '50%', width: 1, top: 0, bottom: 0, backgroundColor: C.mute },
});
