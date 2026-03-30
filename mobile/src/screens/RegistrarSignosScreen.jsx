import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../services/api';

const CAMPOS = [
  { key: 'presionArterial',     label: 'Presión arterial',  placeholder: '120/80',  unidad: 'mmHg',  tipo: 'text',    teclado: 'default'  },
  { key: 'frecuenciaCardiaca',  label: 'Frec. cardíaca',    placeholder: '72',      unidad: 'lpm',   tipo: 'number',  teclado: 'numeric'  },
  { key: 'saturacionO2',        label: 'Saturación O₂',     placeholder: '98',      unidad: '%',     tipo: 'number',  teclado: 'numeric'  },
  { key: 'temperaturaC',        label: 'Temperatura',       placeholder: '36.5',    unidad: '°C',    tipo: 'decimal', teclado: 'decimal-pad' },
  { key: 'pesoKg',              label: 'Peso',              placeholder: '70.0',    unidad: 'kg',    tipo: 'decimal', teclado: 'decimal-pad' },
  { key: 'tallaCm',             label: 'Talla',             placeholder: '170',     unidad: 'cm',    tipo: 'decimal', teclado: 'numeric'  },
  { key: 'glucosaMgdl',         label: 'Glucosa',           placeholder: '90',      unidad: 'mg/dL', tipo: 'number',  teclado: 'numeric'  },
];

function formatHora(fechaStr) {
  return new Date(fechaStr).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' });
}

export default function RegistrarSignosScreen({ route, navigation }) {
  const { cita } = route.params;
  const sv = cita.signosVitales;

  const [form, setForm]             = useState(Object.fromEntries(CAMPOS.map(c => [c.key, ''])));
  const [observaciones, setObs]     = useState('');
  const [guardando, setGuardando]   = useState(false);
  const [error, setError]           = useState('');
  const [guardado, setGuardado]     = useState(false);

  async function guardar() {
    setError('');
    const payload = { citaId: cita.id };
    CAMPOS.forEach(({ key, tipo }) => {
      if (form[key].trim() !== '') {
        payload[key] = (tipo === 'number' || tipo === 'decimal') ? parseFloat(form[key]) : form[key];
      }
    });
    if (observaciones.trim()) payload.observaciones = observaciones.trim();

    const tieneDatos = Object.keys(payload).length > 1; // más que solo citaId
    if (!tieneDatos) {
      setError('Ingresa al menos un valor');
      return;
    }

    setGuardando(true);
    try {
      await api.post('/signos-vitales', payload);
      setGuardado(true);
    } catch (e) {
      setError(e.response?.data?.message || 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  // Vista de éxito
  if (guardado) {
    return (
      <View style={styles.centro}>
        <View style={styles.successCircle}>
          <Feather name="check" size={32} color="#16a34a" />
        </View>
        <Text style={styles.successTitle}>Signos registrados</Text>
        <Text style={styles.successSub}>{cita.paciente?.nombreCompleto}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btnVolver}>
          <Text style={styles.btnVolverTexto}>Volver a la agenda</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Vista de solo lectura si ya existen
  if (sv) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.citaCard}>
          <Text style={styles.citaPaciente}>{cita.paciente?.nombreCompleto}</Text>
          <Text style={styles.citaHora}>{formatHora(cita.fechaHoraInicio)} – {formatHora(cita.fechaHoraFin)}</Text>
        </View>

        <View style={styles.yaRegistradoBanner}>
          <Feather name="check-circle" size={14} color="#16a34a" style={{ marginRight: 6 }} />
          <Text style={styles.yaRegistradoTexto}>Signos vitales ya registrados</Text>
        </View>

        <View style={styles.svGrid}>
          {CAMPOS.map(({ key, label, unidad }) => {
            const val = sv[key];
            if (val == null) return null;
            return (
              <View key={key} style={styles.svCard}>
                <Text style={styles.svLabel}>{label}</Text>
                <Text style={styles.svValor}>{val} <Text style={styles.svUnidad}>{unidad}</Text></Text>
              </View>
            );
          })}
        </View>

        {sv.observaciones ? (
          <View style={styles.obsCard}>
            <Text style={styles.obsLabel}>Observaciones</Text>
            <Text style={styles.obsTexto}>{sv.observaciones}</Text>
          </View>
        ) : null}
      </ScrollView>
    );
  }

  // Formulario de registro
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <View style={styles.citaCard}>
          <Text style={styles.citaPaciente}>{cita.paciente?.nombreCompleto}</Text>
          <Text style={styles.citaHora}>{formatHora(cita.fechaHoraInicio)} – {formatHora(cita.fechaHoraFin)}</Text>
        </View>

        <Text style={styles.hint}>Todos los campos son opcionales. Registra los disponibles.</Text>

        <View style={styles.grid}>
          {CAMPOS.map(({ key, label, placeholder, unidad, teclado }) => (
            <View key={key} style={styles.campo}>
              <Text style={styles.campoLabel}>{label}</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={form[key]}
                  onChangeText={v => setForm(f => ({ ...f, [key]: v }))}
                  placeholder={placeholder}
                  placeholderTextColor="#cbd5e1"
                  keyboardType={teclado}
                />
                <Text style={styles.inputUnidad}>{unidad}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.obsWrap}>
          <Text style={styles.campoLabel}>Observaciones</Text>
          <TextInput
            style={styles.obsInput}
            value={observaciones}
            onChangeText={setObs}
            placeholder="Observaciones adicionales..."
            placeholderTextColor="#cbd5e1"
            multiline
            numberOfLines={3}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTexto}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.btnGuardar, guardando && styles.btnGuardarDisabled]}
          onPress={guardar}
          disabled={guardando}
        >
          {guardando
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.btnGuardarTexto}>Guardar signos vitales</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content:   { padding: 16 },

  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  successCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#f0fdf4',
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  successSub:   { fontSize: 14, color: '#64748b' },
  btnVolver: {
    marginTop: 8, backgroundColor: '#4f46e5',
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10,
  },
  btnVolverTexto: { color: '#fff', fontWeight: '600', fontSize: 14 },

  citaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 14,
  },
  citaPaciente: { fontSize: 15, fontWeight: '700', color: '#0f172a' },
  citaHora:     { fontSize: 13, color: '#94a3b8', marginTop: 3 },

  yaRegistradoBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f0fdf4', borderRadius: 10,
    padding: 12, marginBottom: 16,
  },
  yaRegistradoTexto: { fontSize: 13, color: '#16a34a', fontWeight: '600' },

  svGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  svCard: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: '#f1f5f9',
    minWidth: '45%', flex: 1,
  },
  svLabel:  { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 4 },
  svValor:  { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  svUnidad: { fontSize: 12, fontWeight: '400', color: '#94a3b8' },

  obsCard: {
    backgroundColor: '#fff', borderRadius: 10,
    padding: 14, borderWidth: 1, borderColor: '#f1f5f9',
  },
  obsLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 6 },
  obsTexto: { fontSize: 14, color: '#334155', lineHeight: 20 },

  hint: { fontSize: 12, color: '#94a3b8', marginBottom: 14 },

  grid:  { gap: 10, marginBottom: 14 },
  campo: {},
  campoLabel: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1,
    borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1, fontSize: 14, color: '#0f172a',
    paddingVertical: 11,
  },
  inputUnidad: { fontSize: 12, color: '#94a3b8', marginLeft: 6 },

  obsWrap: { marginBottom: 16 },
  obsInput: {
    backgroundColor: '#fff', borderWidth: 1,
    borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 14, color: '#0f172a',
    textAlignVertical: 'top', minHeight: 72,
  },

  errorBox: {
    backgroundColor: '#fef2f2', borderRadius: 10,
    borderWidth: 1, borderColor: '#fecaca',
    padding: 12, marginBottom: 12,
  },
  errorTexto: { fontSize: 13, color: '#dc2626' },

  btnGuardar: {
    backgroundColor: '#4f46e5', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  btnGuardarDisabled: { opacity: 0.6 },
  btnGuardarTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
