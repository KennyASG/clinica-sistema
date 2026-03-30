# Guía de Instalación — App Móvil Clínica Médica

> Entregar esta guía a cada médico. Tiempo estimado: 10 minutos por dispositivo.

---

## Requisitos del dispositivo

| Plataforma | Versión mínima |
|------------|----------------|
| Android    | 8.0 (Oreo) o superior |
| iOS        | 14.0 o superior |
| Espacio    | 150 MB libres |
| Internet   | WiFi o datos móviles |

---

## Instalación en Android

### Paso 1 — Habilitar instalación de fuentes externas

> Solo necesario la primera vez y únicamente para instalar el APK.

1. Abrir **Ajustes** → **Seguridad** (o "Aplicaciones" dependiendo del fabricante)
2. Activar **"Fuentes desconocidas"** o **"Instalar aplicaciones desconocidas"**
3. Si aparece un aviso, confirmar que confías en el archivo

### Paso 2 — Instalar el APK

1. Recibir el archivo `clinica-medica.apk` por WhatsApp o correo
2. Abrir el archivo descargado (aparece en notificaciones o en la carpeta **Descargas**)
3. Presionar **"Instalar"**
4. Si aparece advertencia de Play Protect, presionar **"Instalar de todas formas"**
5. Esperar a que termine y presionar **"Abrir"**

### Paso 3 — Primera vez

1. La app solicita permiso de **red** — concederlo
2. Ingresar con las mismas credenciales de la web:
   - **Correo:** el que te asignó el administrador
   - **Contraseña:** la que recibiste al activar tu cuenta
3. La sesión se guarda automáticamente — no necesitas volver a ingresar

---

## Instalación en iOS (iPhone/iPad)

> La distribución en iOS requiere que la clínica distribuya la app vía **TestFlight** (beta) o con un perfil de empresa. Coordinar con el administrador del sistema.

### Opción A — TestFlight (recomendado)

1. Instalar **TestFlight** desde el App Store (app gratuita de Apple)
2. El administrador enviará un enlace de invitación por correo
3. Abrir el enlace en el iPhone → presionar **"Instalar"** en TestFlight
4. La app aparece en el inicio de pantalla

### Opción B — Perfil de empresa

1. Recibir el archivo `.ipa` y el perfil de instalación
2. Seguir las instrucciones del perfil enviado por el administrador
3. Ir a **Ajustes** → **General** → **VPN y gestión de dispositivos** → confiar en el desarrollador

---

## Checklist de verificación (completar por cada médico)

Después de instalar, verificar que todo funciona correctamente:

- [ ] **Login correcto** — se puede iniciar sesión con las credenciales asignadas
- [ ] **Búsqueda de paciente** — escribir el nombre de un paciente conocido y aparece en resultados
- [ ] **Apertura de expediente** — al seleccionar un paciente se carga su expediente
- [ ] **Alergias en rojo** — si el paciente tiene alergias, aparecen destacadas al inicio
- [ ] **Banner "Solo lectura"** — visible permanentemente en las pantallas del expediente
- [ ] **Persistencia de sesión** — cerrar la app, volver a abrirla, sigue logueado sin pedir contraseña
- [ ] **Sin acceso a escritura** — intentar cualquier acción de modificación da error o no aparece

---

## Dudas frecuentes

**¿Puedo modificar datos desde la app?**
No. La app es de solo lectura para consultar expedientes en emergencias. Los signos vitales pueden registrarse por personal de enfermería si así lo habilita el administrador.

**¿Qué hago si olvidé mi contraseña?**
Contactar a la secretaria o administrador para que la restablezca desde el panel web.

**¿La app funciona sin internet?**
No. Requiere conexión activa para consultar la base de datos del sistema.

**¿Mis datos están seguros?**
Sí. La app nunca almacena expedientes en el teléfono. Solo muestra datos en pantalla mientras tienes sesión activa. El token de sesión se guarda cifrado.

**¿Puedo instalarla en más de un dispositivo?**
Sí. Puedes tener la app en tu teléfono y tablet con el mismo usuario.

---

## Soporte

Para problemas de instalación o acceso, contactar al administrador del sistema:
- **Nombre:** Kenny Sáenz
- **Canal:** WhatsApp del grupo de la clínica

---

*Versión: 1.0 | Sistema Clínica Médica*
