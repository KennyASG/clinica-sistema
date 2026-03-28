import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import { getUsuario } from '../services/auth';

const ESTADO_CONFIG = {
  pendiente:     { label: 'Pendiente',      color: '#d97706', bg: '#fffbeb' },
  confirmada:    { label: 'Confirmada',     color: '#7c3aed', bg: '#f5f3ff' },
  en_atencion:   { label: 'En atención',    color: '#0891b2', bg: '#ecfeff' },
  atendida:      { label: 'Atendida',       color: '#16a34a', bg: '#f0fdf4' },
  cancelada:     { label: 'Cancelada',      color: '#dc2626', bg: '#fef2f2' },
  no_presentada: { label: 'No se presentó', color: '#64748b', bg: '#f8fafc' },
};

function formatHora(fechaStr) {
  return new Date(fechaStr).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
}

function formatFechaLarga() {
  return new Date().toLocaleDateString('es-GT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}

function iniciales(nombre = '') {
  const p = nombre.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase();
}

export default function AgendaScreen({ navigation }) {
  const [usuario, setUsuario]   = useState(null);
  const [citas, setCitas]       = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refresco, setRefresco] = useState(false);
  const [error, setError]       = useState('');

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  async function cargarDatos(esRefresco = false) {
    if (esRefresco) setRefresco(true);
    else setCargando(true);
    setError('');
    try {
      const u = await getUsuario();
      setUsuario(u);

      if (!u || u.rol !== 'medico') {
        setCitas([]);
        return;
      }

      const hoy   = new Date().toISOString().split('T')[0];
      const { data } = await api.get(`/citas?medico=${u.id}&fecha=${hoy}`);
      setCitas(data);
    } catch {
      setError('No se pudo cargar la agenda');
    } finally {
      setCargando(false);
      setRefresco(false);
    }
  }

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (usuario && usuario.rol !== 'medico') {
    return (
      <View style={styles.centro}>
        <Feather name="calendar" size={40} color="#e2e8f0" />
        <Text style={styles.textoVacio}>Agenda disponible</Text>
        <Text style={styles.textoVacioSub}>solo para médicos</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refresco}
          onRefresh={() => cargarDatos(true)}
          tintColor="#4f46e5"
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.saludo}>Dr. {usuario?.nombre?.split(' ')[0]}</Text>
          <Text style={styles.fecha}>{formatFechaLarga()}</Text>
        </View>
        <View style={styles.contadorBadge}>
          <Text style={styles.contadorNum}>{citas.length}</Text>
          <Text style={styles.contadorLabel}>citas</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : citas.length === 0 ? (
        <View style={styles.vacioCentro}>
          <Feather name="calendar" size={40} color="#e2e8f0" />
          <Text style={styles.textoVacio}>Sin citas para hoy</Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {citas.map((cita, idx) => {
            const cfg        = ESTADO_CONFIG[cita.estado] ?? ESTADO_CONFIG.pendiente;
            const esTerminal = ['atendida', 'cancelada', 'no_presentada'].includes(cita.estado);
            return (
              <TouchableOpacity
                key={cita.id}
                style={[styles.citaCard, esTerminal && styles.citaCardOpaca]}
                onPress={() => navigation.navigate('Busqueda', {
                  screen: 'Expediente',
                  params: { paciente: cita.paciente },
                })}
                activeOpacity={0.75}
              >
                {/* Franja de hora */}
                <View style={styles.horaWrap}>
                  <Text style={styles.hora}>{formatHora(cita.fechaHoraInicio)}</Text>
                  <Text style={styles.horaFin}>{formatHora(cita.fechaHoraFin)}</Text>
                  <View style={[styles.lineaTiempo, idx === citas.length - 1 && styles.lineaTiempoOculta]} />
                </View>

                {/* Contenido */}
                <View style={styles.citaContenido}>
                  <View style={styles.citaHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarTexto}>{iniciales(cita.paciente?.nombreCompleto)}</Text>
                    </View>
                    <View style={styles.citaInfo}>
                      <Text style={styles.pacienteNombre}>{cita.paciente?.nombreCompleto}</Text>
                      {cita.tipoConsulta && (
                        <Text style={styles.tipoConsulta}>{cita.tipoConsulta.nombre}</Text>
                      )}
                    </View>
                    <View style={[styles.estadoPill, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.estadoTexto, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </View>
                  {cita.notasSecretaria ? (
                    <View style={styles.notasRow}>
                      <Feather name="file-text" size={11} color="#94a3b8" style={{ marginRight: 4 }} />
                      <Text style={styles.notasTexto}>{cita.notasSecretaria}</Text>
                    </View>
                  ) : null}

                  {/* Indicador de signos vitales */}
                  {!esTerminal && cita.signosVitales && (
                    <View style={styles.svRegistradoRow}>
                      <Feather name="activity" size={11} color="#16a34a" style={{ marginRight: 4 }} />
                      <Text style={styles.svRegistradoTexto}>Signos vitales registrados</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content:   { paddingBottom: 32 },

  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  textoVacio:    { fontSize: 15, fontWeight: '600', color: '#64748b' },
  textoVacioSub: { fontSize: 13, color: '#94a3b8' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  saludo: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  fecha:  { fontSize: 13, color: '#94a3b8', marginTop: 2, textTransform: 'capitalize' },
  contadorBadge: {
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  contadorNum:   { fontSize: 20, fontWeight: '700', color: '#4f46e5' },
  contadorLabel: { fontSize: 11, color: '#6366f1', marginTop: 1 },

  errorBox: {
    margin: 16, padding: 14,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    borderWidth: 1, borderColor: '#fecaca',
  },
  errorText: { fontSize: 13, color: '#dc2626', textAlign: 'center' },

  vacioCentro: { alignItems: 'center', paddingTop: 60, gap: 10 },

  lista: { paddingHorizontal: 16, paddingTop: 16, gap: 0 },

  citaCard: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  citaCardOpaca: { opacity: 0.5 },

  horaWrap: {
    width: 52,
    alignItems: 'center',
    paddingTop: 2,
    position: 'relative',
  },
  hora:    { fontSize: 12, fontWeight: '700', color: '#4f46e5' },
  horaFin: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  lineaTiempo: {
    position: 'absolute',
    top: 42,
    bottom: -8,
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  lineaTiempoOculta: { display: 'none' },

  citaContenido: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 8,
  },
  citaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#eef2ff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTexto: { fontSize: 12, fontWeight: '700', color: '#4f46e5' },
  citaInfo:   { flex: 1 },
  pacienteNombre: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  tipoConsulta:   { fontSize: 12, color: '#94a3b8', marginTop: 1 },

  estadoPill: {
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  estadoTexto: { fontSize: 11, fontWeight: '600' },

  notasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  notasTexto: { fontSize: 12, color: '#64748b', flex: 1 },

  svRegistradoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  svRegistradoTexto: { fontSize: 12, color: '#16a34a', fontWeight: '500' },
});
