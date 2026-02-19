# Conección App - MVP Starter Template

App SaaS para comunicación entre padres, maestras sombra y terapeutas de niños con necesidades especiales.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 15 + React 19
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **PWA**: next-pwa
- **Hosting**: Vercel + Supabase Cloud

## 📋 Prerequisitos

- Node.js 18+ 
- Cuenta de Supabase (gratuita)
- npm o yarn

## 🛠️ Setup Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto
2. Copia el archivo `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

3. En tu proyecto Supabase, ve a Settings > API y copia:
   - `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public key

4. Pégalos en tu archivo `.env.local`

### 3. Ejecutar el Schema de Base de Datos

1. En Supabase Dashboard, ve a SQL Editor
2. Copia y pega el contenido de `supabase/schema.sql`
3. Ejecuta el script

### 4. Configurar Email Templates (Opcional)

En Supabase Dashboard > Authentication > Email Templates:
- Personaliza el template de "Invite user"
- Personaliza el template de "Confirm signup"

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📱 Funcionalidades del MVP

### ✅ Implementadas

1. **Gestión de Accesos y Permisos**
   - Registro de padres
   - Creación de perfil del niño
   - Invitación por email a maestras y terapeutas
   - Roles: padre, maestra_sombra, terapeuta

2. **Registro Diario de Actividades**
   - Formulario simple para documentar el día
   - Estado de ánimo, actividades, logros, desafíos
   - Notificaciones en tiempo real

3. **Visualización de Progreso**
   - Timeline de todas las actividades
   - Vista de calendario
   - Exportación a PDF (básica)

### 🔜 Próximas funcionalidades

- Sistema de mensajería directa
- Objetivos terapéuticos formales
- Rutinas visuales
- Biblioteca de recursos

## 📂 Estructura del Proyecto

```
/app
  /auth
    /login/page.jsx              # Página de login
    /registro/page.jsx           # Registro de nuevos padres
  /dashboard/page.jsx            # Dashboard principal
  /nino
    /[id]/page.jsx              # Perfil del niño
  /registro-diario/page.jsx      # Formulario registro diario
  /progreso/page.jsx             # Timeline y visualización
  /invitar/page.jsx              # Sistema de invitaciones
  layout.jsx                     # Layout principal
  page.jsx                       # Landing page

/components
  /auth                          # Componentes de autenticación
  /dashboard                     # Componentes del dashboard
  /forms                         # Formularios
  /ui                           # Componentes UI reutilizables

/lib
  /supabase
    client.js                    # Cliente Supabase browser
    server.js                    # Cliente Supabase server
  /utils.js                      # Utilidades

/supabase
  schema.sql                     # Schema de base de datos
  seed.sql                       # Datos de ejemplo (opcional)
```

## 🔐 Roles y Permisos

### Padre
- Crear perfil del niño
- Invitar equipo terapéutico
- Ver y crear registros diarios
- Exportar reportes
- Gestionar accesos

### Maestra Sombra
- Ver perfil del niño
- Crear registros diarios
- Ver progreso
- Ver registros de otros miembros del equipo

### Terapeuta
- Ver perfil del niño
- Ver registros diarios
- Ver progreso
- Agregar notas terapéuticas

## 🌐 Deploy a Producción

### Vercel (Recomendado)

1. Push tu código a GitHub
2. Importa el proyecto en [vercel.com](https://vercel.com)
3. Agrega las variables de entorno (.env.local)
4. Deploy automático ✨

### Variables de Entorno en Producción

Asegúrate de agregar en Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📱 PWA - Instalación en Móvil

La app es una Progressive Web App (PWA):

**iOS (Safari):**
1. Abre la app en Safari
2. Tap el botón "Compartir"
3. "Agregar a pantalla de inicio"

**Android (Chrome):**
1. Abre la app en Chrome
2. Verás un banner "Instalar app"
3. Tap "Instalar"

## 🆘 Troubleshooting

### Error: "Invalid API key"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de reiniciar el servidor después de cambiar .env.local

### Error: "Failed to fetch"
- Verifica que el Schema SQL se haya ejecutado correctamente
- Revisa las Row Level Security policies en Supabase

### PWA no se instala
- Asegúrate de usar HTTPS (en producción)
- Verifica que el manifest.json se genera correctamente

## 📚 Recursos

- [Documentación Next.js](https://nextjs.org/docs)
- [Documentación Supabase](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contribuir

Este es un proyecto starter. Siéntete libre de personalizarlo según tus necesidades.

## 📄 Licencia

MIT
