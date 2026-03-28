import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../services/api';

function iniciales(nombre = '') {
  const p = nombre.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase();
}

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function formatFecha(fechaStr) {
  if (!fechaStr) return '—';
  return new Date(fechaStr).toLocaleDateString('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function ExpedienteScreen({ route }) {
  const { paciente } = route.params;
  const [expediente, setExpediente] = useState(null);
  const [consultas, setConsultas]   = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const { data: pac } = await api.get(`/pacientes/${paciente.id}`);
      setExpediente(pac);

      if (pac.expediente?.id) {
        const { data: hist } = await api.get(`/expedientes/${pac.expediente.id}/historial`);
        setConsultas(hist);
      }
    } catch {
      setError('No se pudo cargar el expediente');
    } finally {
      setCargando(false);
    }
  }

  if (cargando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.cargandoText}>Cargando expediente...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centro}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={cargarDatos} style={styles.reintentar}>
          <Text style={styles.reintentarText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const exp  = expediente?.expediente;
  const edad = calcularEdad(expediente?.fechaNacimiento);

  return (
    <View style={styles.flex}>
      {/* Banner solo lectura — PERMANENTE */}
      <View style={styles.banner}>
        <Feather name="lock" size={11} color="#94a3b8" style={{ marginRight: 6 }} />
        <Text style={styles.bannerTexto}>Solo lectura · Acceso de emergencia</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Header paciente */}
        <View style={styles.headerCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{iniciales(expediente?.nombreCompleto)}</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.nombrePaciente}>{expediente?.nombreCompleto}</Text>
            <Text style={styles.datosPaciente}>
              {edad ? `${edad} años` : ''}
              {edad && expediente?.sexo ? ' · ' : ''}
              {expediente?.sexo ? expediente.sexo.charAt(0).toUpperCase() + expediente.sexo.slice(1) : ''}
            </Text>
            {exp?.tipoSangre && exp.tipoSangre !== 'desconocido' && (
              <View style={styles.sangrePill}>
                <Text style={styles.sangreTexto}>Tipo {exp.tipoSangre.replace('_', ' ')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ALERGIAS — RF-24: visible sin scroll, PRIMERO */}
        {exp?.tieneAlergias && exp?.alergias ? (
          <View style={styles.alergiaBanner}>
            <Feather name="alert-triangle" size={20} color="#ef4444" style={{ marginRight: 12, marginTop: 1 }} />
            <View style={styles.alergiaInfo}>
              <Text style={styles.alergiaTitulo}>ALERGIAS</Text>
              <Text style={styles.alergiaTexto}>{exp.alergias}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.sinAlergias}>
            <Feather name="check-circle" size={14} color="#16a34a" style={{ marginRight: 6 }} />
            <Text style={styles.sinAlergiasTexto}>Sin alergias registradas</Text>
          </View>
        )}

        {/* Medicamentos permanentes — RF-24: SEGUNDO */}
        {exp?.medicamentosPermanentes ? (
          <View style={styles.medicamentosBanner}>
            <Feather name="plus-circle" size={18} color="#3b82f6" style={{ marginRight: 12, marginTop: 1 }} />
            <View style={styles.medicamentosInfo}>
              <Text style={styles.medicamentosTitulo}>MEDICAMENTOS PERMANENTES</Text>
              <Text style={styles.medicamentosTexto}>{exp.medicamentosPermanentes}</Text>
            </View>
          </View>
        ) : null}

        {/* Datos de contacto */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Contacto</Text>
          <View style={styles.card}>
            <FilaDato label="Teléfono" valor={expediente?.telefono} />
            {expediente?.telefonoEmergencia && (
              <FilaDato label="Emergencia" valor={`${expediente.contactoEmergencia || ''} ${expediente.telefonoEmergencia}`} />
            )}
            {expediente?.correo && (
              <FilaDato label="Correo" valor={expediente.correo} />
            )}
          </View>
        </View>

        {/* Antecedentes */}
        {(exp?.enfermedadesCronicas || exp?.antecedentesFamiliares ||
          exp?.antecedentesQuirurgicos || exp?.antecedentesTraumaticos) ? (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Antecedentes</Text>
            <View style={styles.card}>
              {exp.enfermedadesCronicas && <FilaDato label="Enf. crónicas" valor={exp.enfermedadesCronicas} />}
              {exp.antecedentesFamiliares && <FilaDato label="Familiares" valor={exp.antecedentesFamiliares} />}
              {exp.antecedentesQuirurgicos && <FilaDato label="Quirúrgicos" valor={exp.antecedentesQuirurgicos} />}
              {exp.antecedentesTraumaticos && <FilaDato label="Traumáticos" valor={exp.antecedentesTraumaticos} />}
            </View>
          </View>
        ) : null}

        {/* Historial de consultas */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Historial ({consultas.length})</Text>
          {consultas.length === 0 ? (
            <View style={styles.sinConsultas}>
              <Text style={styles.sinConsultasTexto}>Sin consultas registradas</Text>
            </View>
          ) : (
            consultas.map((c, idx) => (
              <View key={c.id} style={[styles.consultaCard, idx > 0 && styles.consultaCardMt]}>
                <View style={styles.consultaHeader}>
                  <Text style={styles.consultaFecha}>{formatFecha(c.fechaHora)}</Text>
                  <Text style={styles.consultaMedico}>Dr. {c.medico?.nombreCompleto}</Text>
                </View>
                {c.motivoConsulta ? (
                  <Text style={styles.consultaMotivo}>{c.motivoConsulta}</Text>
                ) : null}
                {c.diagnosticoCie10 || c.diagnosticoDescripcion ? (
                  <View style={styles.diagnosticoRow}>
                    {c.diagnosticoCie10 && (
                      <Text style={styles.ciePill}>{c.diagnosticoCie10}</Text>
                    )}
                    {c.diagnosticoDescripcion && (
                      <Text style={styles.diagnosticoDesc}>{c.diagnosticoDescripcion}</Text>
                    )}
                  </View>
                ) : null}
                {c.tratamiento ? (
                  <Text style={styles.consultaSub}>Tratamiento: {c.tratamiento}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={styles.espacioFinal} />
      </ScrollView>
    </View>
  );
}

function FilaDato({ label, valor }) {
  if (!valor) return null;
  return (
    <View style={styles.filaDato}>
      <Text style={styles.filaDatoLabel}>{label}</Text>
      <Text style={styles.filaDatoValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  cargandoText: { marginTop: 12, fontSize: 14, color: '#94a3b8' },
  errorText: { fontSize: 15, color: '#dc2626', textAlign: 'center' },
  reintentar: {
    marginTop: 16, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: '#4f46e5', borderRadius: 8,
  },
  reintentarText: { color: '#fff', fontWeight: '600' },

  // Banner solo lectura
  banner: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTexto: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },

  // Header paciente
  headerCard: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#eef2ff',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  avatarTexto: { fontSize: 18, fontWeight: '700', color: '#4f46e5' },
  headerInfo: { flex: 1 },
  nombrePaciente: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  datosPaciente: { fontSize: 13, color: '#64748b', marginTop: 2 },
  sangrePill: {
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3,
  },
  sangreTexto: { fontSize: 12, fontWeight: '600', color: '#475569' },

  // Alergias — RF-24
  alergiaBanner: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
  },
  alergiaInfo: { flex: 1 },
  alergiaTitulo: { fontSize: 11, fontWeight: '700', color: '#dc2626', letterSpacing: 0.5 },
  alergiaTexto: { fontSize: 14, color: '#7f1d1d', marginTop: 3, lineHeight: 20 },

  sinAlergias: {
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sinAlergiasTexto: { fontSize: 13, color: '#16a34a', fontWeight: '500' },

  // Medicamentos — RF-24
  medicamentosBanner: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
  },
  medicamentosInfo: { flex: 1 },
  medicamentosTitulo: { fontSize: 11, fontWeight: '700', color: '#1d4ed8', letterSpacing: 0.5 },
  medicamentosTexto: { fontSize: 14, color: '#1e3a5f', marginTop: 3, lineHeight: 20 },

  // Secciones
  seccion: { marginHorizontal: 16, marginTop: 20 },
  seccionTitulo: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  filaDato: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  filaDatoLabel: { fontSize: 12, color: '#94a3b8', width: 100 },
  filaDatoValor: { fontSize: 13, color: '#0f172a', flex: 1 },

  // Consultas
  sinConsultas: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9',
  },
  sinConsultasTexto: { fontSize: 13, color: '#94a3b8' },

  consultaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  consultaCardMt: { marginTop: 8 },
  consultaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  consultaFecha: { fontSize: 12, fontWeight: '600', color: '#4f46e5' },
  consultaMedico: { fontSize: 12, color: '#94a3b8' },
  consultaMotivo: { fontSize: 14, color: '#0f172a', lineHeight: 20, marginBottom: 6 },
  diagnosticoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  ciePill: {
    backgroundColor: '#eef2ff', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 2,
    fontSize: 11, fontWeight: '700', color: '#4f46e5',
  },
  diagnosticoDesc: { fontSize: 13, color: '#475569', flex: 1 },
  consultaSub: { fontSize: 12, color: '#64748b', marginTop: 4 },

  espacioFinal: { height: 20 },
});
