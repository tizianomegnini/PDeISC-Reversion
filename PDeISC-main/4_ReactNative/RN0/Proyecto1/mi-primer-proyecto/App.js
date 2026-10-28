import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';

const Tab = createBottomTabNavigator();

// Tab 1: pantalla limpia con Hola Mundo
function HomeScreen({ isDarkMode }) {
  const dynamicStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <View style={[styles.homeContainer, dynamicStyles.container]}>
      <Text style={[styles.homeText, dynamicStyles.text]}>¡Hola Mundo!</Text>
    </View>
  );
}

// Tab 2: con diferentes tipos de cajas (sólida, punteada, minimalista)
function StylesScreen({ isDarkMode }) {
  const [mensaje, setMensaje] = useState('Explora los diferentes estilos abajo');
  const dynamicStyles = isDarkMode ? darkStyles : lightStyles;

  return (
    <ScrollView contentContainerStyle={[styles.otherContainer, dynamicStyles.container]}>
      <Text style={[styles.otherTitle, dynamicStyles.title]}>Variantes de Estilos</Text>
      <Text style={[styles.otherSubtitle, dynamicStyles.subtitle]}>{mensaje}</Text>

      {/* 1. Caja con estilo normal / sólido */}
      <View style={[styles.boxSolid, dynamicStyles.boxSolid]}>
        <Text style={[styles.boxTitleSolid, dynamicStyles.boxTitle]}>Caja Sólida</Text>
        <Text style={[styles.boxText, dynamicStyles.boxText]}>Fondo limpio con bordes redondeados y sombra suave.</Text>
      </View>

      {/* 2. Caja con líneas punteadas */}
      <View style={[styles.boxDashed, dynamicStyles.boxDashed]}>
        <Text style={[styles.boxTitleDashed, dynamicStyles.boxTitleDashed]}>Caja Punteada</Text>
        <Text style={[styles.boxTextDashed, dynamicStyles.boxTextDashed]}>Diseño con borde discontinuo ideal para destacar áreas.</Text>
      </View>

      {/* 3. Caja minimalista */}
      <View style={[styles.boxMinimal, dynamicStyles.boxMinimal]}>
        <Text style={[styles.boxTitleMinimal, dynamicStyles.boxTitleMinimal]}>Caja Minimalista</Text>
        <Text style={[styles.boxTextMinimal, dynamicStyles.boxTextMinimal]}>Sin relleno pesado, solo un borde fino y elegante.</Text>
      </View>

      {/* Botón interactivo */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => setMensaje('¡Excelente! Has interactuado con los componentes.')}
      >
        <Text style={styles.buttonText}>Cambiar estado</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <NavigationContainer>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarActiveTintColor: '#6C5CE7',
          tabBarInactiveTintColor: isDarkMode ? '#888888' : '#A0A0A0',
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
            borderTopColor: isDarkMode ? '#333333' : '#E0E0E0',
            height: 60,
            paddingBottom: 8,
          },
          headerStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
          },
          headerTintColor: isDarkMode ? '#FFFFFF' : '#222222',
          headerRight: () => (
            <TouchableOpacity onPress={toggleTheme} style={styles.themeButton}>
              <Text style={{ fontSize: 20 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          ),
          // Iconos nativos seguros sin requerir librerías externas
          tabBarIcon: ({ focused }) => {
            let iconSymbol = '🏠';

            if (route.name === 'Inicio') {
              iconSymbol = focused ? '🏠' : '🛖';
            } else if (route.name === 'Estilos') {
              iconSymbol = focused ? '🎨' : '🖼️';
            }

            return <Text style={{ fontSize: 20 }}>{iconSymbol}</Text>;
          },
        })}
      >
        <Tab.Screen name="Inicio">
          {(props) => <HomeScreen {...props} isDarkMode={isDarkMode} />}
        </Tab.Screen>
        <Tab.Screen name="Estilos">
          {(props) => <StylesScreen {...props} isDarkMode={isDarkMode} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Estilos base comunes
const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeText: {
    fontSize: 24,
  },
  otherContainer: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
  },
  otherTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  otherSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
  },
  boxSolid: {
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    marginBottom: 15,
  },
  boxDashed: {
    borderRadius: 15,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 20,
    width: '100%',
    maxWidth: 340,
    marginBottom: 15,
  },
  boxMinimal: {
    borderRadius: 15,
    borderWidth: 1.5,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6C5CE7',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 25,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    marginBottom: 30,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  themeButton: {
    marginRight: 15,
    padding: 5,
  },
});

// Estilos Modo Claro
const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
  },
  text: {
    color: '#222222',
  },
  title: {
    color: '#2C3E50',
  },
  subtitle: {
    color: '#7F8C8D',
  },
  boxSolid: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6C5CE7',
    marginBottom: 5,
  },
  boxText: {
    fontSize: 14,
    color: '#555',
  },
  boxDashed: {
    backgroundColor: '#F3F0FF',
    borderColor: '#6C5CE7',
  },
  boxTitleDashed: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#512DA8',
    marginBottom: 5,
  },
  boxTextDashed: {
    fontSize: 14,
    color: '#4A235A',
  },
  boxMinimal: {
    backgroundColor: 'transparent',
    borderColor: '#BDC3C7',
  },
  boxTitleMinimal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34495E',
    marginBottom: 5,
  },
  boxTextMinimal: {
    fontSize: 14,
    color: '#7F8C8D',
  },
});

// Estilos Modo Oscuro
const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
  },
  text: {
    color: '#FFFFFF',
  },
  title: {
    color: '#FFFFFF',
  },
  subtitle: {
    color: '#A0A0A0',
  },
  boxSolid: {
    backgroundColor: '#1E1E1E',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9D8DF1',
    marginBottom: 5,
  },
  boxText: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  boxDashed: {
    backgroundColor: '#1A1829',
    borderColor: '#9D8DF1',
  },
  boxTitleDashed: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#BDB3F7',
    marginBottom: 5,
  },
  boxTextDashed: {
    fontSize: 14,
    color: '#D0C9F9',
  },
  boxMinimal: {
    backgroundColor: 'transparent',
    borderColor: '#444444',
  },
  boxTitleMinimal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginBottom: 5,
  },
  boxTextMinimal: {
    fontSize: 14,
    color: '#999999',
  },
});