import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import api from '../services/api';

function iniciales(nombre = '') {
  const p = nombre.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase();
}

export default function BusquedaScreen({ navigation, onLogout }) {
  const [query, setQuery]         = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando]   = useState(false);
  const [buscado, setBuscado]     = useState(false);

  const buscar = useCallback(async (texto) => {
    if (texto.trim().length < 2) {
      setResultados([]);
      setBuscado(false);
      return;
    }
    setCargando(true);
    setBuscado(true);
    try {
      const { data } = await api.get(`/pacientes?q=${encodeURIComponent(texto.trim())}`);
      setResultados(data);
    } catch {
      setResultados([]);
    } finally {
      setCargando(false);
    }
  }, []);

  function handleChange(texto) {
    setQuery(texto);
    buscar(texto);
  }

  function abrirExpediente(paciente) {
    navigation.navigate('Expediente', { paciente });
  }

  return (
    <View style={styles.container}>

      {/* Search bar */}
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChange}
          placeholder="Buscar por nombre o DPI..."
          placeholderTextColor="#94a3b8"
          autoCorrect={false}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
      </View>

      {/* Resultados */}
      {cargando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : buscado && resultados.length === 0 ? (
        <View style={styles.centro}>
          <Text style={styles.textoVacio}>No se encontraron pacientes</Text>
          <Text style={styles.textoVacioSub}>para "{query}"</Text>
        </View>
      ) : resultados.length > 0 ? (
        <FlatList
          data={resultados}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={styles.separador} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.fila}
              onPress={() => abrirExpediente(item)}
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarTexto}>{iniciales(item.nombreCompleto)}</Text>
              </View>
              <View style={styles.filaInfo}>
                <Text style={styles.nombre}>{item.nombreCompleto}</Text>
                <Text style={styles.dpi}>DPI: {item.dpi}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.centro}>
          <Text style={styles.textoVacio}>Escribe al menos 2 caracteres</Text>
          <Text style={styles.textoVacioSub}>para buscar un paciente</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  searchBox: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },

  lista: { paddingVertical: 8 },
  separador: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 72 },

  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexto: { fontSize: 13, fontWeight: '700', color: '#4f46e5' },
  filaInfo: { flex: 1 },
  nombre: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  dpi: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  chevron: { fontSize: 22, color: '#cbd5e1' },

  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  textoVacio: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  textoVacioSub: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
});
