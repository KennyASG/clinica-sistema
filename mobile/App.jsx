import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import BusquedaScreen from './src/screens/BusquedaScreen';
import ExpedienteScreen from './src/screens/ExpedienteScreen';
import { logout } from './src/services/auth';

const Stack = createNativeStackNavigator();

export default function App() {
  const [verificando, setVerificando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  // RF-27 — Verifica sesión persistida al arrancar
  useEffect(() => {
    AsyncStorage.getItem('token').then((token) => {
      setAutenticado(!!token);
      setVerificando(false);
    });
  }, []);

  const handleLogin = useCallback(() => setAutenticado(true), []);

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
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#fff' },
          headerTintColor: '#4f46e5',
          headerTitleStyle: { fontWeight: '700', color: '#0f172a' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#f8fafc' },
        }}
      >
        {!autenticado ? (
          <Stack.Screen
            name="Login"
            options={{ headerShown: false }}
          >
            {() => <LoginScreen onLoginExitoso={handleLogin} />}
          </Stack.Screen>
        ) : (
          <>
            <Stack.Screen
              name="Busqueda"
              options={{
                title: 'Buscar paciente',
                headerRight: () => (
                  <LogoutButton onLogout={handleLogout} />
                ),
              }}
            >
              {(props) => <BusquedaScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen
              name="Expediente"
              options={({ route }) => ({
                title: route.params?.paciente?.nombreCompleto?.split(' ')[0] || 'Expediente',
              })}
              component={ExpedienteScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function LogoutButton({ onLogout }) {
  return (
    <TouchableOpacity onPress={onLogout} style={{ paddingHorizontal: 4 }}>
      <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '500' }}>Salir</Text>
    </TouchableOpacity>
  );
}
