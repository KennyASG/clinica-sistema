import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  await AsyncStorage.multiSet([
    ['token', data.token],
    ['usuario', JSON.stringify({ id: data.id, rol: data.rol, nombre: data.nombre, email: data.email })],
  ]);
  return data;
}

export async function logout() {
  await AsyncStorage.multiRemove(['token', 'usuario']);
}

export async function getToken() {
  return AsyncStorage.getItem('token');
}

export async function getUsuario() {
  const raw = await AsyncStorage.getItem('usuario');
  return raw ? JSON.parse(raw) : null;
}
