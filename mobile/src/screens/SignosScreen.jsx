import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, TextInput, RefreshControl, StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';

function formatFechaHoy() {
  return new Date().toLocaleDateString('es-GT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function formatHora(fechaStr) {
  return new Date(fechaStr).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
}

function iniciales(nombre = '') {
  const p = nombre.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase();
}

const TERMINALES = ['atendida', 'cancelada', 'no_presentada'];

export default function SignosScreen({ navigation }) {
  const [citas, setCitas]       = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refresco, setRefresco] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError]       = useState('');
  const insets = useSafeAreaInsets();

  useFocusEffect(
    useCallback(() => {
      cargarCitas();
    }, [])
  );

  async function cargarCitas(esRefresco = false) {
    if (esRefresco) setRefresco(true);
    else setCargando(true);
    setError('');
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const { data } = await api.get(`/citas?fecha=${hoy}`);
      setCitas(data);
    } catch {
      setError('No se pudo cargar las citas de hoy');
    } finally {
      setCargando(false);
      setRefresco(false);
    }
  }

  const citasFiltradas = busqueda.trim().length < 2
    ? citas
    : citas.filter(c => {
        const q = busqueda.toLowerCase();
        return (
          c.paciente?.nombreCompleto?.toLowerCase().includes(q) ||
          c.medico?.nombreCompleto?.toLowerCase().includes(q) ||
          c.tipoConsulta?.nombre?.toLowerCase().includes(q)
        );
      });

  const pendientes  = citasFiltradas.filter(c => !c.signosVitales && !TERMINALES.includes(c.estado));
  const registradas = citasFiltradas.filter(c =>  c.signosVitales);
  const terminales  = citasFiltradas.filter(c => !c.signosVitales &&  TERMINALES.includes(c.estado));

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  const pendientesCount = citas.filter(c => !c.signosVitales && !['atendida','cancelada','no_presentada'].includes(c.estado)).length;

  return (
    <View style={styles.flex}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <MaterialCommunityIcons
          name="stethoscope"
          size={130}
          color="#fff"
          style={styles.watermark}
        />
        <View>
          <Text style={styles.headerTitulo}>Signos vitales</Text>
          <Text style={styles.headerFecha}>{formatFechaHoy()}</Text>
        </View>
        {pendientesCount > 0 && (
          <View style={styles.pendienteBadge}>
            <Text style={styles.pendienteNum}>{pendientesCount}</Text>
            <Text style={styles.pendienteLabel}>pendientes</Text>
          </View>
        )}
      </View>

      {/* Buscador */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={15} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar paciente, médico o tipo..."
          placeholderTextColor="#cbd5e1"
          clearButtonMode="while-editing"
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')} style={styles.clearBtn}>
            <Feather name="x" size={14} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refresco} onRefresh={() => cargarCitas(true)} tintColor="#4f46e5" />
        }
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTexto}>{error}</Text>
          </View>
        ) : citasFiltradas.length === 0 ? (
          <View style={styles.vacioCentro}>
            <Feather name="activity" size={38} color="#e2e8f0" />
            <Text style={styles.vacioTexto}>
              {busqueda.trim().length >= 2 ? 'Sin resultados' : 'Sin citas para hoy'}
            </Text>
          </View>
        ) : (
          <>
            {pendientes.length > 0 && (
              <Seccion
                titulo="Pendientes de registrar"
                icono="clock"
                color="#d97706"
                citas={pendientes}
                navigation={navigation}
              />
            )}
            {registradas.length > 0 && (
              <Seccion
                titulo="Signos registrados"
                icono="check-circle"
                color="#16a34a"
                citas={registradas}
                navigation={navigation}
              />
            )}
            {terminales.length > 0 && (
              <Seccion
                titulo="Citas terminadas"
                icono="minus-circle"
                color="#94a3b8"
                citas={terminales}
                navigation={navigation}
                opaca
              />
            )}
          </>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

function Seccion({ titulo, icono, color, citas, navigation, opaca = false }) {
  return (
    <View style={styles.seccion}>
      <View style={styles.seccionHeader}>
        <Feather name={icono} size={13} color={color} style={{ marginRight: 6 }} />
        <Text style={[styles.seccionTitulo, { color }]}>{titulo}</Text>
        <View style={[styles.contadorBadge, { backgroundColor: color + '18' }]}>
          <Text style={[styles.contadorTexto, { color }]}>{citas.length}</Text>
        </View>
      </View>
      <View style={styles.lista}>
        {citas.map(cita => (
          <TarjetaCita
            key={cita.id}
            cita={cita}
            navigation={navigation}
            opaca={opaca}
          />
        ))}
      </View>
    </View>
  );
}

function TarjetaCita({ cita, navigation, opaca }) {
  const tieneSV = !!cita.signosVitales;

  return (
    <TouchableOpacity
      style={[styles.card, opaca && styles.cardOpaca]}
      onPress={() => navigation.navigate('RegistrarSignos', { cita })}
      activeOpacity={0.75}
    >
      {/* Avatar + info */}
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciales(cita.paciente?.nombreCompleto)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNombre} numberOfLines={1}>{cita.paciente?.nombreCompleto}</Text>
          <Text style={styles.cardSub}>
            {formatHora(cita.fechaHoraInicio)}
            {cita.tipoConsulta ? ` · ${cita.tipoConsulta.nombre}` : ''}
          </Text>
          <Text style={styles.cardMedico} numberOfLines={1}>Dr. {cita.medico?.nombreCompleto}</Text>
        </View>
      </View>

      {/* Estado SV */}
      <View style={styles.cardRight}>
        {tieneSV ? (
          <View style={styles.svBadgeOk}>
            <Feather name="check" size={11} color="#16a34a" />
          </View>
        ) : opaca ? (
          <Feather name="minus" size={16} color="#cbd5e1" />
        ) : (
          <View style={styles.svBadgePendiente}>
            <Feather name="plus" size={11} color="#d97706" />
          </View>
        )}
        <Feather name="chevron-right" size={14} color="#cbd5e1" style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: '#f8fafc' },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12 },

  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: -18,
    bottom: -28,
    opacity: 0.07,
  },
  headerTitulo: { fontSize: 17, fontWeight: '700', color: '#f1f5f9' },
  headerFecha:  { fontSize: 13, color: '#64748b', marginTop: 2, textTransform: 'capitalize' },
  pendienteBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pendienteNum:   { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  pendienteLabel: { fontSize: 11, color: '#64748b', marginTop: 1 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: {
    flex: 1, fontSize: 14, color: '#0f172a',
    paddingVertical: 6,
  },
  clearBtn: { padding: 4 },

  errorBox: {
    margin: 16, padding: 14,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    borderWidth: 1, borderColor: '#fecaca',
  },
  errorTexto: { fontSize: 13, color: '#dc2626', textAlign: 'center' },

  vacioCentro: { alignItems: 'center', paddingTop: 60, gap: 10 },
  vacioTexto:  { fontSize: 15, fontWeight: '600', color: '#94a3b8' },

  seccion:       { marginBottom: 20 },
  seccionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  seccionTitulo: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3, flex: 1 },
  contadorBadge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  contadorTexto: { fontSize: 11, fontWeight: '700' },

  lista: { gap: 8 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardOpaca: { opacity: 0.5 },
  cardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTexto: { fontSize: 13, fontWeight: '700', color: '#4f46e5' },
  cardInfo:   { flex: 1 },
  cardNombre: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  cardSub:    { fontSize: 12, color: '#64748b', marginTop: 2 },
  cardMedico: { fontSize: 11, color: '#94a3b8', marginTop: 1 },

  cardRight: { alignItems: 'center', gap: 2, marginLeft: 8 },
  svBadgeOk: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#f0fdf4',
    borderWidth: 1, borderColor: '#bbf7d0',
    alignItems: 'center', justifyContent: 'center',
  },
  svBadgePendiente: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#fffbeb',
    borderWidth: 1, borderColor: '#fde68a',
    alignItems: 'center', justifyContent: 'center',
  },
});
