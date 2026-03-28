import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../services/api';
import { guardarReciente, obtenerRecientes } from '../utils/recientes';

function iniciales(nombre = '') {
  const p = nombre.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase();
}

export default function BusquedaScreen({ navigation }) {
  const [query, setQuery]           = useState('');
  const [resultados, setResultados] = useState([]);
  const [recientes, setRecientes]   = useState([]);
  const [cargando, setCargando]     = useState(false);
  const [buscado, setBuscado]       = useState(false);

  useEffect(() => {
    obtenerRecientes().then(setRecientes);
    const unsubscribe = navigation.addListener('focus', () => {
      obtenerRecientes().then(setRecientes);
    });
    return unsubscribe;
  }, [navigation]);

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

  async function abrirExpediente(paciente) {
    await guardarReciente(paciente);
    navigation.navigate('Expediente', { paciente });
  }

  const mostrarRecientes = query.length < 2 && recientes.length > 0;
  const mostrarResultados = query.length >= 2;

  return (
    <View style={styles.container}>

      {/* Search bar */}
      <View style={styles.searchBox}>
        <View style={styles.inputWrap}>
          <Feather name="search" size={16} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={handleChange}
            placeholder="Buscar por nombre o DPI..."
            placeholderTextColor="#94a3b8"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Últimos vistos */}
      {mostrarRecientes && (
        <View style={styles.seccion}>
          <View style={styles.seccionHeader}>
            <Feather name="clock" size={12} color="#94a3b8" />
            <Text style={styles.seccionTitulo}>Últimos vistos</Text>
          </View>
          {recientes.map((p, idx) => (
            <FilaPaciente
              key={p.id}
              paciente={p}
              onPress={() => abrirExpediente(p)}
              separador={idx < recientes.length - 1}
            />
          ))}
        </View>
      )}

      {/* Resultados búsqueda */}
      {mostrarResultados && (
        cargando ? (
          <View style={styles.centro}>
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : buscado && resultados.length === 0 ? (
          <View style={styles.centro}>
            <Feather name="user-x" size={36} color="#e2e8f0" />
            <Text style={styles.textoVacio}>No se encontraron pacientes</Text>
            <Text style={styles.textoVacioSub}>para "{query}"</Text>
          </View>
        ) : (
          <View style={styles.seccion}>
            <View style={styles.seccionHeader}>
              <Feather name="users" size={12} color="#94a3b8" />
              <Text style={styles.seccionTitulo}>{resultados.length} resultado{resultados.length !== 1 ? 's' : ''}</Text>
            </View>
            <FlatList
              data={resultados}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separador} />}
              renderItem={({ item, index }) => (
                <FilaPaciente
                  paciente={item}
                  onPress={() => abrirExpediente(item)}
                  separador={index < resultados.length - 1}
                />
              )}
            />
          </View>
        )
      )}

      {/* Estado vacío inicial */}
      {!mostrarRecientes && !mostrarResultados && (
        <View style={styles.centro}>
          <Feather name="search" size={36} color="#e2e8f0" />
          <Text style={styles.textoVacio}>Busca un paciente</Text>
          <Text style={styles.textoVacioSub}>por nombre o DPI</Text>
        </View>
      )}
    </View>
  );
}

function FilaPaciente({ paciente, onPress, separador }) {
  return (
    <>
      <TouchableOpacity style={styles.fila} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>
            {(() => {
              const p = paciente.nombreCompleto.trim().split(' ');
              return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : paciente.nombreCompleto.slice(0, 2).toUpperCase();
            })()}
          </Text>
        </View>
        <View style={styles.filaInfo}>
          <Text style={styles.nombre}>{paciente.nombreCompleto}</Text>
          <Text style={styles.dpi}>DPI: {paciente.dpi}</Text>
        </View>
        <Feather name="chevron-right" size={18} color="#cbd5e1" />
      </TouchableOpacity>
      {separador && <View style={styles.separador} />}
    </>
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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  inputIcon: { marginRight: 2 },
  input: { flex: 1, fontSize: 14, color: '#0f172a', padding: 0 },

  seccion: {
    backgroundColor: '#fff',
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  seccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  seccionTitulo: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#eef2ff',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  avatarTexto: { fontSize: 13, fontWeight: '700', color: '#4f46e5' },
  filaInfo: { flex: 1 },
  nombre: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  dpi: { fontSize: 12, color: '#94a3b8', marginTop: 1 },
  separador: { height: 1, backgroundColor: '#f8fafc', marginLeft: 66 },

  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  textoVacio: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  textoVacioSub: { fontSize: 13, color: '#94a3b8' },
});
