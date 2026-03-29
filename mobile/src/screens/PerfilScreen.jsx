import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getUsuario } from '../services/auth';

const ROLES = {
  medico:        { label: 'Médico',        icon: 'activity',  color: '#4f46e5', bg: '#eef2ff' },
  enfermera:     { label: 'Enfermera',     icon: 'heart',     color: '#0891b2', bg: '#ecfeff' },
  secretaria:    { label: 'Secretaria',    icon: 'calendar',  color: '#d97706', bg: '#fffbeb' },
  administrador: { label: 'Administrador', icon: 'shield',    color: '#7c3aed', bg: '#f5f3ff' },
};

function iniciales(nombre = '') {
  const p = nombre.trim().split(' ');
  return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : nombre.slice(0, 2).toUpperCase();
}

export default function PerfilScreen({ onLogout }) {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    getUsuario().then(setUsuario);
  }, []);

  if (!usuario) return null;

  const rolCfg = ROLES[usuario.rol] ?? { label: usuario.rol, icon: 'user', color: '#64748b', bg: '#f8fafc' };

  return (
    <View style={styles.container}>

      {/* Avatar + nombre */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{iniciales(usuario.nombre)}</Text>
        </View>
        <Text style={styles.nombre}>{usuario.nombre}</Text>
        <View style={[styles.rolPill, { backgroundColor: rolCfg.bg }]}>
          <Feather name={rolCfg.icon} size={12} color={rolCfg.color} style={{ marginRight: 5 }} />
          <Text style={[styles.rolTexto, { color: rolCfg.color }]}>{rolCfg.label}</Text>
        </View>
      </View>

      {/* Info básica */}
      <View style={styles.seccion}>
        <View style={styles.fila}>
          <Feather name="user" size={15} color="#94a3b8" style={styles.filaIcono} />
          <View>
            <Text style={styles.filaLabel}>ID de usuario</Text>
            <Text style={styles.filaValor}>{usuario.id?.slice(0, 8)}…</Text>
          </View>
        </View>
        <View style={styles.separador} />
        <View style={styles.fila}>
          <Feather name="shield" size={15} color="#94a3b8" style={styles.filaIcono} />
          <View>
            <Text style={styles.filaLabel}>Rol en el sistema</Text>
            <Text style={styles.filaValor}>{rolCfg.label}</Text>
          </View>
        </View>
        <View style={styles.separador} />
        <View style={styles.fila}>
          <Feather name="smartphone" size={15} color="#94a3b8" style={styles.filaIcono} />
          <View>
            <Text style={styles.filaLabel}>Acceso</Text>
            <Text style={styles.filaValor}>App móvil · Clínica Médica</Text>
          </View>
        </View>
      </View>

      {/* Cerrar sesión */}
      <TouchableOpacity style={styles.btnCerrar} onPress={onLogout} activeOpacity={0.8}>
        <Feather name="log-out" size={16} color="#ef4444" style={{ marginRight: 10 }} />
        <Text style={styles.btnCerrarTexto}>Cerrar sesión</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingTop: 32,
  },

  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#eef2ff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarTexto: { fontSize: 26, fontWeight: '700', color: '#4f46e5' },
  nombre: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  rolPill: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  rolTexto: { fontSize: 13, fontWeight: '600' },

  seccion: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    marginBottom: 24,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  filaIcono: { marginRight: 14 },
  filaLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '500', marginBottom: 2 },
  filaValor: { fontSize: 14, color: '#0f172a', fontWeight: '500' },
  separador: { height: 1, backgroundColor: '#f8fafc', marginHorizontal: 18 },

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
