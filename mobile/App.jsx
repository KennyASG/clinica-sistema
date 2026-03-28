import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen           from './src/screens/LoginScreen';
import BusquedaScreen        from './src/screens/BusquedaScreen';
import ExpedienteScreen      from './src/screens/ExpedienteScreen';
import AgendaScreen          from './src/screens/AgendaScreen';
import SignosScreen          from './src/screens/SignosScreen';
import RegistrarSignosScreen from './src/screens/RegistrarSignosScreen';
import { logout }            from './src/services/auth';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const HEADER_OPTS = {
  headerStyle: { backgroundColor: '#fff' },
  headerTintColor: '#4f46e5',
  headerTitleStyle: { fontWeight: '700', color: '#0f172a' },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: '#f8fafc' },
};

function BusquedaStack({ onLogout }) {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen
        name="BusquedaMain"
        component={BusquedaScreen}
        options={{
          title: 'Buscar paciente',
          headerRight: () => (
            <TouchableOpacity onPress={onLogout} style={{ paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '500' }}>Salir</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="Expediente"
        component={ExpedienteScreen}
        options={({ route }) => ({
          title: route.params?.paciente?.nombreCompleto?.split(' ')[0] || 'Expediente',
        })}
      />
    </Stack.Navigator>
  );
}

function AgendaStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen
        name="AgendaMain"
        component={AgendaScreen}
        options={{ title: 'Mi agenda' }}
      />
      <Stack.Screen
        name="Expediente"
        component={ExpedienteScreen}
        options={({ route }) => ({
          title: route.params?.paciente?.nombreCompleto?.split(' ')[0] || 'Expediente',
        })}
      />
    </Stack.Navigator>
  );
}

function SignosStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen
        name="SignosMain"
        component={SignosScreen}
        options={{ title: 'Signos vitales' }}
      />
      <Stack.Screen
        name="RegistrarSignos"
        component={RegistrarSignosScreen}
        options={({ route }) => ({
          title: route.params?.cita?.paciente?.nombreCompleto?.split(' ')[0] || 'Signos vitales',
        })}
      />
    </Stack.Navigator>
  );
}

function TabsAutenticadas({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
        },
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ color, size }) => {
          const icons = { Busqueda: 'search', Agenda: 'calendar', Signos: 'activity' };
          return <Feather name={icons[route.name] ?? 'circle'} size={size - 2} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Busqueda" options={{ title: 'Pacientes' }}>
        {() => <BusquedaStack onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen name="Agenda"  component={AgendaStack}  options={{ title: 'Mi agenda' }} />
      <Tab.Screen name="Signos"  component={SignosStack}  options={{ title: 'Signos' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [verificando, setVerificando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('token').then(token => {
      setAutenticado(!!token);
      setVerificando(false);
    });
  }, []);

  const handleLogin  = useCallback(() => setAutenticado(true), []);
  const handleLogout = useCallback(async () => {
    await logout();
    setAutenticado(false);
  }, []);

  if (verificando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!autenticado ? (
          <Stack.Screen name="Login">
            {() => <LoginScreen onLoginExitoso={handleLogin} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="App">
            {() => <TabsAutenticadas onLogout={handleLogout} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}
