import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { login } from '../services/auth';

export default function LoginScreen({ onLoginExitoso }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError]       = useState('');
  const insets = useSafeAreaInsets();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setError('Ingresa tu email y contraseña');
      return;
    }
    setCargando(true);
    setError('');
    try {
      await login(email.trim().toLowerCase(), password);
      onLoginExitoso();
    } catch (err) {
      const msg = err.response?.data?.message || 'Error al iniciar sesión';
      setError(msg);
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Hero — mismo lenguaje que las otras pantallas */}
        <View style={[styles.hero, { paddingTop: insets.top + 32 }]}>
          <MaterialCommunityIcons
            name="stethoscope"
            size={160}
            color="#fff"
            style={styles.watermark}
          />
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>CM</Text>
          </View>
          <Text style={styles.titulo}>Clínica Médica</Text>
          <Text style={styles.subtitulo}>Sistema de gestión médica</Text>
        </View>

        {/* Formulario */}
        <View style={styles.cuerpo}>
          <Text style={styles.cardTitulo}>Iniciar sesión</Text>

          <View style={styles.campo}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={15} color="#94a3b8" style={styles.inputIcono} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="correo@clinica.gt"
                placeholderTextColor="#cbd5e1"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.campo}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={15} color="#94a3b8" style={styles.inputIcono} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#cbd5e1"
                secureTextEntry
              />
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color="#dc2626" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.boton, cargando && styles.botonDisabled]}
            onPress={handleLogin}
            disabled={cargando}
            activeOpacity={0.8}
          >
            {cargando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.botonTexto}>Entrar</Text>
            }
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flexGrow: 1 },

  hero: {
    backgroundColor: '#1e293b',
    alignItems: 'center',
    paddingBottom: 36,
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    right: -24,
    bottom: -32,
    opacity: 0.07,
  },
  logoCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  logoText:  { color: '#f1f5f9', fontSize: 24, fontWeight: '700' },
  titulo:    { fontSize: 22, fontWeight: '700', color: '#f1f5f9' },
  subtitulo: { fontSize: 13, color: '#64748b', marginTop: 5 },

  cuerpo: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  cardTitulo: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 22 },

  campo: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 7 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcono: { marginRight: 10 },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 13,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: '#dc2626', flex: 1 },

  boton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  botonDisabled: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
