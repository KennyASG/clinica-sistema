import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getUsuario } from '../services/auth';

const ROLES = {
  medico:        { label: 'Médico',        icon: 'activity',  color: '#0891b2', bg: '#ecfeff' },
  enfermera:     { label: 'Enfermera',     icon: 'heart',     color: '#16a34a', bg: '#f0fdf4' },
  secretaria:    { label: 'Secretaria',    icon: 'calendar',  color: '#d97706', bg: '#fffbeb' },
  administrador: { label: 'Administrador', icon: 'shield',    color: '#7c3aed', bg: '#f5f3ff' },
};

function iniciales(nombre = '') {
  const p = nombre.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase();
}

export default function PerfilScreen({ onLogout }) {
  const [usuario, setUsuario] = useState(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    getUsuario().then(setUsuario);
  }, []);

  if (!usuario) return null;

  const rolCfg = ROLES[usuario.rol] ?? { label: usuario.rol, icon: 'user', color: '#64748b', bg: '#f8fafc' };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Hero header — respeta el notch */}
      <View style={[styles.hero, { paddingTop: insets.top + 24 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciales(usuario.nombre)}</Text>
        </View>
        <Text style={styles.nombre}>{usuario.nombre}</Text>
        <View style={[styles.rolPill, { backgroundColor: rolCfg.bg }]}>
          <Feather name={rolCfg.icon} size={12} color={rolCfg.color} style={{ marginRight: 5 }} />
          <Text style={[styles.rolTexto, { color: rolCfg.color }]}>{rolCfg.label}</Text>
        </View>
      </View>

      {/* Contenido */}
      <View style={styles.cuerpo}>

        {/* Info básica */}
        <View style={styles.seccion}>
          <FilaInfo icono="shield" label="Rol en el sistema" valor={rolCfg.label} />
          <View style={styles.sep} />
          <FilaInfo icono="hash" label="ID de usuario" valor={`${usuario.id?.slice(0, 8)}…`} />
          <View style={styles.sep} />
          <FilaInfo icono="smartphone" label="Aplicación" valor="Clínica Médica · Móvil" />
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.btnCerrar} onPress={onLogout} activeOpacity={0.8}>
          <Feather name="log-out" size={16} color="#ef4444" style={{ marginRight: 10 }} />
          <Text style={styles.btnCerrarTexto}>Cerrar sesión</Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

function FilaInfo({ icono, label, valor }) {
  return (
    <View style={styles.fila}>
      <View style={styles.filaIconoWrap}>
        <Feather name={icono} size={15} color="#64748b" />
      </View>
      <View>
        <Text style={styles.filaLabel}>{label}</Text>
        <Text style={styles.filaValor}>{valor}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  hero: {
    backgroundColor: '#0f172a',
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarTexto: { fontSize: 28, fontWeight: '700', color: '#94a3b8' },
  nombre:  { fontSize: 20, fontWeight: '700', color: '#f1f5f9', marginBottom: 10 },
  rolPill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  rolTexto: { fontSize: 13, fontWeight: '600' },

  cuerpo: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },

  seccion: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    marginBottom: 20,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  filaIconoWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  filaLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '500', marginBottom: 2 },
  filaValor: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
  sep: { height: 1, backgroundColor: '#f8fafc', marginHorizontal: 18 },

  btnCerrar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingVertical: 16,
  },
  btnCerrarTexto: { fontSize: 15, fontWeight: '600', color: '#ef4444' },
});
