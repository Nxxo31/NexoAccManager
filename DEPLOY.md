# NexoAccManager — Deploy con Oracle Cloud + Dokploy

## Arquitectura

```
                    ┌─────────────────────────────────────┐
                    │        Oracle Cloud VPS             │
                    │                                     │
                    │  ┌─────────┐   ┌────────────────┐  │
                    │  │  nginx  │──▶│ Landing (Next) │  │
                    │  │ :80/443 │   │   :3001        │  │
                    │  └────┬────┘   └────────────────┘  │
                    │       │                             │
                    │       └────▶ /api/* ──▶ Backend   │
                    │                           :3000   │
                    │                             │     │
                    │                      ┌──────┴──┐  │
                    │                      │ PostgreSQL│  │
                    │                      │   :5432   │  │
                    └──────────────────────└───────────┘  │
                                                        │
                   ┌─────────────────────────────────────┘
                   │          Dokploy Dashboard
                   │  (gestiona containers, logs, SSL)
```

## Servicios

| Servicio | Puerto interno | Propósito |
|----------|----------------|-----------|
| nginx | 80, 443 | Reverse proxy + SSL |
| Landing | 3001 | Frontend Next.js |
| Backend | 3000 | API Fastify |
| PostgreSQL | 5432 | Base de datos |

---

## 1. Crear cuenta Oracle Cloud yVM

### 1.1 Registro en Oracle Cloud
1. Ve a [oracle.com/cloud](https://www.oracle.com/cloud/)
2. Click en "Start for Free" → crea cuenta con tu email
3. Completar verificación de identidad (tarjeta de crédito para verificación, no se cobra)

### 1.2 Crear Always Free VM
1. Una vez logueado en Oracle Cloud Console, ve a **Hamburger menu → Compute → Instances**
2. Click **Create Instance**
3. Configurar:
   - **Name**: `nexo-deploy`
   - ** compartment**: Default
   - **Placement**: Mantener defaults
   - **Image**: Oracle Linux 8 o Ubuntu 22.04 LTS (recomendado)
   - **Shape**: `VM.Standard.A1.Flex` (4 OCPUs, 24GB RAM — FREE)
   - **Networking**: Create new VCN o usar default
   - **Subnet**: Public subnet
   - **SSH Keys**: Generar par de claves o subir clave pública existente
4. Click **Create**

### 1.3 Configurar Firewall (OCI)
1. Ve a **Networking → Virtual Cloud Networks → tu VCN**
2. Click en tu subnet → **Security Lists**
3. Agregar reglas de entrada para:
   - 80 (HTTP)
   - 443 (HTTPS)
   - 22 (SSH)

### 1.4 Configurar Firewall local (Ubuntu)
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 1.5 Conectar por SSH
```bash
# Desde tu máquina local
ssh -i /ruta/a/tu/clave.pem opc@IP_DE_TU_VM
```

---

## 2. Instalar Docker y Docker Compose

### 2.1 Docker
```bash
# Ubuntu
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2.2 Verificar instalación
```bash
docker --version
docker-compose --version
```

---

## 3. Instalar Dokploy

Dokploy usa Coolify como base. Hay dos opciones:

### Opción A: Instalador automático de Dokploy (recomendado)
```bash
# SSH a tu VM como root
sudo -i

# Instalar Dokploy
curl -fsSL https://get.docker.com | sh

# Alternativa: usar el instalador oficial de Dokploy
# (visita https://docs.dokploy.com para el comando actual)
# El instalador típicamente es:
curl -sS https://raw.githubusercontent.com/dokploy/dokploy/main/install.sh | bash
```

### Opción B: Instalar Coolify manualmente
```bash
# Coolify es la base de Dokploy
# Sigue las instrucciones en: https://coolify.io/docs
```

### 2.3 Post-instalación
1. Accede a `http://IP-DE-TU-VM:3000` o el puerto configurado
2. Crea tu cuenta de admin
3. Configura tu dominio (opcional pero recomendado)

---

## 4. Configurar DNS (Cloudflare recomendado)

### 4.1 Registro en Cloudflare
1. Ve a [cloudflare.com](https://cloudflare.com) y registra tu dominio
2. Cambia los nameservers de tu dominio a los de Cloudflare

### 4.2 Crear registros DNS
| Tipo | Name | Content | Proxy |
|------|------|---------|-------|
| A | @ | IP_DE_TU_VM | Proxy (amarillo) |
| A | api | IP_DE_TU_VM | Proxy (amarillo) |
| CNAME | www | tu-dominio.com | Proxy (amarillo) |

### 4.3 Configurar SSL en Cloudflare
- SSL/TLS → Mode: **Full** o **Flexible**
- Enable "Always Use HTTPS"

---

## 5. Deploy en Dokploy

### 5.1 Agregar dominio en Dokploy
1. Ve a **Settings → Domains**
2. Agrega tu dominio (`tu-dominio.com`)
3. Doko deploy creará el certificado SSL automaticamente con Let's Encrypt

### 5.2 Deploy Backend (NexoAccManager-Backend)
1. En Dokploy: **New Project** → `NexoAccManager-Backend`
2. Repository: `https://github.com/Nxxo31/NexoAccManager-Backend`
3. Branch: `main`
4. Build type: **Dockerfile**
5. Environment variables ( Production):
```
DATABASE_URL=postgresql://postgres:TU_PASSWORD@postgres:5432/nexo_backend?schema=public
JWT_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nTU_KEY\n-----END PRIVATE KEY-----
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\nTU_KEY\n-----END PUBLIC KEY-----
JWT_SECRET=un-secret-alfanumerico-largo-32chars
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://tu-dominio.com
SMTP_HOST=smtp.tu-servidor.com
SMTP_PORT=587
SMTP_USER=tu@email.com
SMTP_PASS=tu-password
SMTP_FROM=NexoAccManager <noreply@tu-dominio.com>
```
6. Port: `3000`
7. Health check: `/health`
8. Click **Deploy**

### 5.3 Deploy Landing (NexoAccManager-Landing)
1. En Dokploy: **New Project** → `NexoAccManager-Landing`
2. Repository: `https://github.com/Nxxo31/NexoAccManager-Landing`
3. Branch: `main`
4. Build type: **Dockerfile**
5. Environment variables:
```
NEXT_PUBLIC_BACKEND_URL=https://tu-dominio.com/api
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```
6. Port: `3001` (si no usa Dockerfile, ajustar)
7. Click **Deploy**

---

## 6. Docker Compose Standalone (sin Dokploy)

Si prefieres no usar Dokploy, puedes usar docker-compose directamente:

### 6.1 Copiar archivos al servidor
```bash
# Desde tu máquina local
scp -i clave.pem -r ~/proyectos/NexoAccManager opc@IP:/home/opc/
```

### 6.2 En el servidor
```bash
cd /home/opc/NexoAccManager
docker-compose -f docker-compose.prod.yml up -d
```

---

## 7. Verificar deploy

### 7.1 Checks de salud
```bash
# Landing
curl https://tu-dominio.com
# Esperado: HTML de Next.js

# Backend
curl https://tu-dominio.com/api/health
# Esperado: {"status":"ok","timestamp":"..."}

# Registro
curl -X POST https://tu-dominio.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}'
```

### 7.2 Logs
```bash
# Si usas Dokploy: ver en el dashboard
# Si usas docker-compose:
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 8. Troubleshooting

### Error: "Cannot connect to database"
- Verificar que PostgreSQL esté corriendo
- Verificar DATABASE_URL con el formato correcto
- Ver logs: `docker-compose logs postgres`

### Error: "Connection refused" en nginx
- Verificar que los contenedores estén corriendo: `docker ps`
- Verificar puertos: `ss -tlnp | grep -E '80|443|3000|3001'`

### Error: SSL certificate invalid
- En Cloudflare: verificar que SSL mode sea "Full"
- En Dokploy: esperar unos minutos para Let's Encrypt

### Performance: VM lenta
- Verificar que sea la shape correcta (VM.Standard.A1.Flex)
- Oracle puede throttlear si se exceden los recursos free

---

## Comandos útiles

```bash
# Ver estado de contenedores
docker ps

# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar servicio
docker-compose -f docker-compose.prod.yml restart nombre_servicio

# Ver uso de recursos
docker stats

# Executar migrate en el contenedor del backend
docker exec -it nexobackend npx prisma migrate deploy

# Backup de PostgreSQL
docker exec nexopostgres pg_dump -U postgres nexobackend > backup.sql
```

---

## Mantenimiento

### Actualizar código
1. Push a GitHub → el webhook de Dokploy detectará el cambio y redeployará
2. O manualmente: `docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d`

### Backups
- Configurar backup automático de PostgreSQL con cron:
```bash
0 2 * * * docker exec nexopostgres pg_dump -U postgres nexobackend > /backups/nexo_$(date +\%Y\%m\%d).sql
```