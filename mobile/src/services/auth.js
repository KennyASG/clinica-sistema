import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  await AsyncStorage.setItem('token', data.token);
  return data;
}

export async function logout() {
  await AsyncStorage.removeItem('token');
}

export async function getToken() {
  return AsyncStorage.getItem('token');
}
