# Setup de Monitoreo — Clínica Médica

## 1. UptimeRobot (disponibilidad del sitio)

### Registrar el monitor
1. Crear cuenta en https://uptimerobot.com (plan gratuito es suficiente)
2. **Add New Monitor** con estos valores:

| Campo          | Valor                                      |
|----------------|--------------------------------------------|
| Monitor Type   | HTTP(s)                                    |
| Friendly Name  | Clínica Médica — API                       |
| URL            | `https://tu-dominio.gt/health`             |
| Monitoring Interval | 5 minutes                            |
| Alert Contacts | tu-email@clinica.gt                        |

3. En **Alert Contacts** → agregar email del administrador
4. Activar notificación para: **Down**, **Up** (cuando recupere)

### Monitor adicional para el frontend
Repetir el proceso con `https://tu-dominio.gt` (raíz del sitio).

---

## 2. Alertas en DigitalOcean (CPU y Disco)

### Desde el panel de DigitalOcean

1. Ir a **Monitoring → Alert Policies → Create Policy**

#### Alerta de CPU
| Campo    | Valor                          |
|----------|-------------------------------|
| Metric   | CPU Usage                      |
| Condition | Greater than **80%**         |
| Duration  | 5 minutes                     |
| Droplets  | clinica-sistema (tu droplet)  |
| Notify    | Email del administrador       |

#### Alerta de disco
| Campo    | Valor                          |
|----------|-------------------------------|
| Metric   | Disk Utilization               |
| Condition | Greater than **85%**         |
| Duration  | 5 minutes                     |
| Droplets  | clinica-sistema               |
| Notify    | Email del administrador       |

#### Alerta de memoria
| Campo    | Valor                          |
|----------|-------------------------------|
| Metric   | Memory Utilization             |
| Condition | Greater than **90%**         |
| Duration  | 5 minutes                     |

### Desde la CLI de doctl
```bash
doctl monitoring alert create \
  --compare GreaterThan \
  --description "CPU alta — Clínica" \
  --enabled=true \
  --entities "$(doctl compute droplet list --format ID --no-header)" \
  --period 5m \
  --type v1/insights/droplet/cpu \
  --value 80 \
  --emails admin@clinica.gt
```

---

## 3. Logs del servidor (PM2)

```bash
# Ver logs en tiempo real
pm2 logs clinica-api

# Últimas 200 líneas
pm2 logs clinica-api --lines 200

# Rotación automática de logs (ejecutar una vez)
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 10
```

---

## 4. Verificación rápida post-deploy

```bash
# Health check
curl https://tu-dominio.gt/health

# Uso de recursos
htop

# Estado de PM2
pm2 status

# Espacio en disco
df -h

# Logs de errores recientes
pm2 logs clinica-api --err --lines 50
```

---

## 5. Cron jobs configurados en el servidor

```
# Editar crontab del usuario que corre la app
crontab -e

# Agregar:
# Backup diario a las 2am
0 2 * * * /opt/clinica/scripts/backup.sh >> /var/log/clinica-backup.log 2>&1

# Limpiar logs de PM2 semanalmente
0 3 * * 0 pm2 flush clinica-api
```
