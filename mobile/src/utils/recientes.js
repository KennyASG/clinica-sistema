import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY    = '@recientes_pacientes';
const LIMITE = 5;

export async function guardarReciente(paciente) {
  try {
    const raw   = await AsyncStorage.getItem(KEY);
    const lista = raw ? JSON.parse(raw) : [];
    const filtrado = lista.filter(p => p.id !== paciente.id);
    const nueva = [{ id: paciente.id, nombreCompleto: paciente.nombreCompleto, dpi: paciente.dpi }, ...filtrado].slice(0, LIMITE);
    await AsyncStorage.setItem(KEY, JSON.stringify(nueva));
  } catch {}
}

export async function obtenerRecientes() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
