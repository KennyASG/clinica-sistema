import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pantallas (se implementan en Sprint 7-8)
// import LoginScreen from './src/screens/LoginScreen';
// import BusquedaScreen from './src/screens/BusquedaScreen';
// import ExpedienteScreen from './src/screens/ExpedienteScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [tokenVerificado, setTokenVerificado] = useState(false);
  const [tokenExiste, setTokenExiste] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('token').then((token) => {
      setTokenExiste(!!token);
      setTokenVerificado(true);
    });
  }, []);

  if (!tokenVerificado) return null;

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1d4ed8' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        {/* Navegación se configura en Sprint 7-8 */}
        {/* {!tokenExiste ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Busqueda" component={BusquedaScreen} options={{ title: 'Buscar Paciente' }} />
            <Stack.Screen name="Expediente" component={ExpedienteScreen} options={{ title: 'Expediente' }} />
          </>
        )} */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
