import React, { useState, useRef, ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';

type SectionProps = {
  title: string;
  description: string;
  children?: ReactNode;
  darkMode: boolean;
};

const Section = ({ title, description, children, darkMode }: SectionProps) => (
  <View style={[styles.card, darkMode && styles.cardDark]}>
    <Text style={[styles.cardTitle, darkMode && styles.textDark]}>{title}</Text>
    <Text style={[styles.cardDesc, darkMode && styles.cardDescDark]}>{description}</Text>
    {children ? <View style={styles.demo}>{children}</View> : null}
  </View>
);

const LOGO = 'https://reactnative.dev/img/tiny_logo.png';
const FRUTAS = ['🍎 Manzana', '🍌 Banana', '🍇 Uva', '🍓 Frutilla', '🍊 Naranja'];

export default function App() {
  const [texto, setTexto] = useState('');
  const [switchOn, setSwitchOn] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [contador, setContador] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 300);
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <SafeAreaView style={[styles.flex, darkMode && styles.flexDark]}>
      <KeyboardAvoidingView
        style={[styles.flex, darkMode && styles.flexDark]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor={darkMode ? '#1F2937' : '#4F46E5'}
        />

        <ScrollView
          ref={scrollViewRef}
          style={[styles.flex, darkMode && styles.flexDark]}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={darkMode ? '#fff' : '#4F46E5'}
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Encabezado */}
          <View style={[styles.header, darkMode && styles.headerDark]}>
            <View style={styles.headerTopRow}>
              <Text style={styles.headerTitle}>Componentes RN</Text>
              <View style={styles.themeSwitchContainer}>
                <Text style={{ color: '#fff', fontSize: 12, marginRight: 6 }}>
                  {darkMode ? '🌙' : '☀️'}
                </Text>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#767577', true: '#4B5563' }}
                  thumbColor={darkMode ? '#F3F4F6' : '#f4f3f4'}
                />
              </View>
            </View>
            <Text style={styles.headerSub}>
              Modo oscuro/claro y componentes funcionales 👇
            </Text>
          </View>

          <Section title="View" description="Contenedor básico para agrupar y maquetar con flexbox." darkMode={darkMode}>
            <View style={styles.row}>
              <View style={[styles.box, { backgroundColor: '#F87171' }]} />
              <View style={[styles.box, { backgroundColor: '#FBBF24' }]} />
              <View style={[styles.box, { backgroundColor: '#34D399' }]} />
            </View>
          </Section>

          <Section title="Text" description="Muestra texto plano o anidado con estilos propios." darkMode={darkMode}>
            <Text style={[{ fontSize: 18 }, darkMode && { color: '#E5E7EB' }]}>
              Texto <Text style={{ fontWeight: 'bold' }}>en negrita</Text> y{' '}
              <Text style={{ color: '#4F46E5' }}>de color</Text>.
            </Text>
          </Section>

          <Section title="Image" description="Muestra imágenes remotas o locales." darkMode={darkMode}>
            <Image source={{ uri: LOGO }} style={styles.logo} />
          </Section>

          <Section title="ImageBackground" description="Imagen que sirve como fondo con contenido encima." darkMode={darkMode}>
            <ImageBackground
              source={{ uri: 'https://picsum.photos/400/200' }}
              style={styles.imageBg}
              imageStyle={{ borderRadius: 12 }}
            >
              <Text style={styles.imageBgText}>Texto sobre la imagen</Text>
            </ImageBackground>
          </Section>

          <Section title="TextInput" description="Campo de entrada de texto interactivo." darkMode={darkMode}>
            <TextInput
              style={[styles.input, darkMode && styles.inputDark]}
              placeholder="Escribí algo..."
              placeholderTextColor={darkMode ? '#9CA3AF' : '#9CA3AF'}
              value={texto}
              onChangeText={setTexto}
            />
            <Text style={[styles.muted, darkMode && styles.mutedDark]}>Escribiste: {texto || '—'}</Text>
          </Section>

          <Section title="Button" description="Botón nativo simple del sistema." darkMode={darkMode}>
            <Button title="Botón nativo" onPress={() => Alert.alert('¡Hola!', 'Tocaste el Button')} />
          </Section>

          <Section title="TouchableOpacity" description="Área táctil que reduce su opacidad al presionar." darkMode={darkMode}>
            <TouchableOpacity style={styles.customBtn} onPress={() => setContador(contador + 1)}>
              <Text style={styles.customBtnText}>Tocado {contador} veces</Text>
            </TouchableOpacity>
          </Section>

          <Section title="Pressable" description="Control total de estados táctiles (normal, long press)." darkMode={darkMode}>
            <Pressable
              onPress={() => Alert.alert('Pressable', 'Press normal')}
              onLongPress={() => Alert.alert('Pressable', 'Press largo')}
              style={({ pressed }) => [
                styles.customBtn,
                { backgroundColor: pressed ? '#3730A3' : '#4F46E5' },
              ]}
            >
              <Text style={styles.customBtnText}>Presioná (o mantené)</Text>
            </Pressable>
          </Section>

          <Section title="Switch" description="Interruptor de encendido/apagado booleano." darkMode={darkMode}>
            <View style={styles.row}>
              <Switch value={switchOn} onValueChange={setSwitchOn} />
              <Text style={[styles.muted, darkMode && styles.mutedDark]}>  {switchOn ? 'Activado' : 'Desactivado'}</Text>
            </View>
          </Section>

          <Section title="ActivityIndicator" description="Spinner de carga activo." darkMode={darkMode}>
            <ActivityIndicator size="large" color="#4F46E5" />
          </Section>

          <Section title="FlatList" description="Lista horizontal performante y optimizada." darkMode={darkMode}>
            <FlatList
              horizontal
              data={FRUTAS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <View style={[styles.chip, darkMode && styles.chipDark]}>
                  <Text style={darkMode && { color: '#E5E7EB' }}>{item}</Text>
                </View>
              )}
              showsHorizontalScrollIndicator={false}
            />
          </Section>

          <Section title="ScrollView" description="Contenedor desplazable interno." darkMode={darkMode}>
            <ScrollView horizontal style={{ maxHeight: 60 }} showsHorizontalScrollIndicator={false}>
              {[...Array(8)].map((_, i) => (
                <View key={i} style={[styles.box, { backgroundColor: `hsl(${i * 45}, 70%, 60%)`, marginRight: 8 }]} />
              ))}
            </ScrollView>
          </Section>

          <Section title="Modal" description="Ventana flotante superpuesta." darkMode={darkMode}>
            <Button title="Abrir Modal" onPress={() => setModalVisible(true)} />
          </Section>

          {/* Componentes adicionales funcionales sin conflictos de scroll */}
          <Text style={[styles.subheading, darkMode && styles.textDark]}>Componentes Avanzados y APIs</Text>

          <Section title="SafeAreaView" description="Envuelve la pantalla evitando solaparse con notches o barras de estado." darkMode={darkMode}>
            <View style={[styles.safeAreaDemo, darkMode && styles.safeAreaDemoDark]}>
              <Text style={[{ fontSize: 13, textAlign: 'center' }, darkMode && { color: '#E5E7EB' }]}>
                🛡️ Activo protegiendo los bordes del dispositivo.
              </Text>
            </View>
          </Section>

          <Section title="TouchableHighlight" description="Igual que TouchableOpacity pero oscurece el fondo al contacto." darkMode={darkMode}>
            <TouchableHighlight
              style={styles.touchableHighlightBtn}
              underlayColor="#3730A3"
              onPress={() => Alert.alert('TouchableHighlight', '¡Presionado con éxito!')}
            >
              <Text style={styles.customBtnText}>Presioname (Highlight)</Text>
            </TouchableHighlight>
          </Section>

          <Section title="Alert (API)" description="Lanza diálogos de alerta nativos del sistema operativo." darkMode={darkMode}>
            <Button
              title="Disparar Alerta Nativa"
              color="#10B981"
              onPress={() => Alert.alert('Alerta del Sistema', 'Este es un aviso nativo generado por la API Alert.')}
            />
          </Section>
        </ScrollView>

        {/* Botón flotante para subir arriba */}
        {showScrollTop && (
          <TouchableOpacity style={styles.scrollTopButton} onPress={scrollToTop}>
            <Text style={styles.scrollTopText}>↑</Text>
          </TouchableOpacity>
        )}

        {/* Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, darkMode && styles.cardDark]}>
              <Text style={[styles.cardTitle, darkMode && styles.textDark]}>¡Soy un Modal!</Text>
              <Text style={[styles.cardDesc, darkMode && styles.cardDescDark]}>Se dibuja encima de todo lo demás.</Text>
              <Button title="Cerrar" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F3F4F6' },
  flexDark: { backgroundColor: '#111827' },
  scrollContent: { paddingBottom: 40 },
  header: {
    backgroundColor: '#4F46E5',
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 16,
  },
  headerDark: { backgroundColor: '#1F2937' },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeSwitchContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSub: { color: '#C7D2FE', marginTop: 6 },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardDark: { backgroundColor: '#1F2937' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  textDark: { color: '#F9FAFB' },
  cardDesc: { fontSize: 14, color: '#6B7280', marginTop: 4, lineHeight: 20 },
  cardDescDark: { color: '#9CA3AF' },
  demo: { marginTop: 12 },
  subheading: { fontSize: 20, fontWeight: '700', margin: 16, color: '#111827' },
  row: { flexDirection: 'row', alignItems: 'center' },
  box: { width: 50, height: 50, borderRadius: 10, marginRight: 8 },
  logo: { width: 60, height: 60 },
  imageBg: { height: 120, justifyContent: 'center', alignItems: 'center' },
  imageBgText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    color: '#111827',
  },
  inputDark: {
    borderColor: '#374151',
    color: '#F9FAFB',
    backgroundColor: '#374151',
  },
  muted: { color: '#6B7280', marginTop: 6 },
  mutedDark: { color: '#9CA3AF' },
  customBtn: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  touchableHighlightBtn: {
    backgroundColor: '#4F46E5',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  customBtnText: { color: '#fff', fontWeight: '600' },
  chip: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  chipDark: { backgroundColor: '#374151' },
  safeAreaDemo: { padding: 10, backgroundColor: '#EEF2FF', borderRadius: 8, borderWidth: 1, borderColor: '#C7D2FE' },
  safeAreaDemoDark: { backgroundColor: '#374151', borderColor: '#4B5563' },
  scrollTopButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: '#4F46E5',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  scrollTopText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 12 },
});