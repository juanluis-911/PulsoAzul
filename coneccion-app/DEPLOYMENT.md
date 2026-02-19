# Guía de Deployment - Conección App

## 🚀 Deployment a Producción

### Paso 1: Preparar Supabase

1. **Crear proyecto en Supabase**
   - Ve a [supabase.com](https://supabase.com)
   - Click en "New Project"
   - Elige nombre, región y contraseña
   - Espera a que se provisione (1-2 minutos)

2. **Ejecutar Schema de Base de Datos**
   ```
   - En Supabase Dashboard → SQL Editor
   - Copia el contenido de supabase/schema.sql
   - Pega y ejecuta (Run)
   ```

3. **Configurar Autenticación**
   ```
   - Ve a Authentication → Settings
   - Site URL: https://tu-app.vercel.app
   - Redirect URLs: https://tu-app.vercel.app/**
   ```

4. **Personalizar Email Templates** (Opcional)
   ```
   - Authentication → Email Templates
   - Personaliza:
     - Confirm signup
     - Invite user
     - Magic Link
   ```

### Paso 2: Deployment en Vercel

1. **Push a GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/tu-usuario/coneccion-app.git
   git push -u origin main
   ```

2. **Importar en Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Click "New Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente Next.js

3. **Configurar Variables de Entorno**
   ```
   En Vercel Dashboard → Settings → Environment Variables:
   
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
   NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Espera 2-3 minutos
   - ¡Tu app está en vivo! 🎉

### Paso 3: Configurar Dominio Personalizado (Opcional)

1. **En Vercel**
   ```
   Settings → Domains → Add Domain
   Ingresa: tu-dominio.com
   ```

2. **En tu proveedor de dominio**
   ```
   Agregar registro CNAME:
   Nombre: www
   Valor: cname.vercel-dns.com
   ```

3. **Actualizar Supabase**
   ```
   Authentication → Settings
   Site URL: https://tu-dominio.com
   Redirect URLs: https://tu-dominio.com/**
   ```

## 📱 Hacer PWA Instalable

La app ya está configurada como PWA, pero necesitas:

1. **Crear iconos**
   - Crea un icono de 512x512px
   - Usa [favicon.io](https://favicon.io) para generar todos los tamaños
   - Coloca en `/public`:
     - icon-192x192.png
     - icon-512x512.png
     - favicon.ico

2. **Verificar HTTPS**
   - Vercel automáticamente usa HTTPS
   - PWA solo funciona con HTTPS

3. **Probar instalación**
   - Abre en Chrome/Safari
   - Busca el banner "Instalar app"
   - En iOS: Share → Add to Home Screen

## 🔐 Seguridad en Producción

### Row Level Security (RLS)

Las policies ya están configuradas en el schema, pero verifica:

```sql
-- Verificar que RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Todas las tablas deben tener rowsecurity = true
```

### Rate Limiting

Supabase incluye rate limiting por defecto:
- Auth: 30 requests/hour por IP
- Database: Según tu plan

Para rate limiting adicional en Next.js, considera:
- [upstash/ratelimit](https://github.com/upstash/ratelimit)
- Middleware de Vercel

### Variables de Entorno

✅ NUNCA commitees `.env.local` al repo
✅ Usa variables de entorno de Vercel
✅ Las keys `NEXT_PUBLIC_*` son públicas (cliente)
✅ Para keys privadas, usa sin el prefijo y accede solo en server

## 🔄 Continuous Deployment

Vercel hace CD automático:
1. Push a `main` → Deploy a producción
2. Push a otra rama → Deploy preview
3. PR → Deploy preview con URL única

## 📊 Monitoreo

### Supabase Dashboard
- Database: Queries, performance
- Auth: Usuarios activos, sign-ups
- Storage: Si usas archivos
- Logs: Errores de RLS, queries

### Vercel Analytics
```bash
# Agregar Vercel Analytics
npm install @vercel/analytics
```

En `app/layout.jsx`:
```javascript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## 🐛 Debugging en Producción

1. **Vercel Logs**
   ```
   Dashboard → Deployments → [tu deployment] → Functions
   ```

2. **Supabase Logs**
   ```
   Dashboard → Logs → API / Database
   ```

3. **Browser Console**
   - Abre DevTools en producción
   - Network tab para ver requests fallidos

## 🔧 Troubleshooting Común

### Error: "Failed to fetch"
- Verifica variables de entorno en Vercel
- Revisa CORS en Supabase
- Checa RLS policies

### PWA no se instala
- Verifica que estás en HTTPS
- Checa manifest.json está accesible
- Iconos deben existir en /public

### Emails de invitación no llegan
- Verifica SMTP settings en Supabase
- Revisa spam folder
- En desarrollo, usa Supabase inbox

## 📈 Siguientes Pasos

Después del MVP, considera:

1. **Notificaciones Push**
   ```bash
   npm install web-push
   ```

2. **Exportación de reportes a PDF**
   ```bash
   npm install jspdf jspdf-autotable
   ```

3. **Upload de imágenes**
   - Usar Supabase Storage
   - Fotos de actividades

4. **Mensajería en tiempo real**
   - Supabase Realtime
   - Chat entre equipo

## 💰 Costos Estimados

**Fase MVP (0-100 usuarios):**
- Supabase: Gratis
- Vercel: Gratis
- Dominio: $12/año
- **Total: $12/año**

**Escala (100-1000 usuarios):**
- Supabase Pro: $25/mes
- Vercel Pro: $20/mes
- **Total: $45/mes + dominio**

## 📞 Soporte

- Supabase: [supabase.com/docs](https://supabase.com/docs)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Next.js: [nextjs.org/docs](https://nextjs.org/docs)
