# Roadmap - Conección App

## ✅ MVP Completado (v0.1)

### Funcionalidades Core
- [x] Sistema de autenticación (registro/login)
- [x] Creación de perfiles de niños
- [x] Sistema de roles (padre, maestra_sombra, terapeuta)
- [x] Registro diario de actividades
- [x] Timeline de progreso
- [x] Invitación de equipo terapéutico
- [x] Permisos por rol (lectura/edición)
- [x] Diseño responsive
- [x] PWA configurado

### Infraestructura
- [x] Next.js 15 + React 19
- [x] Supabase (Auth + Database)
- [x] Tailwind CSS
- [x] Row Level Security policies
- [x] Schema de base de datos completo

## 🚧 Próximas Funcionalidades (v0.2)

### Alta Prioridad

1. **Sistema de Invitaciones Real**
   - [ ] API route para invitar usuarios
   - [ ] Email templates personalizados
   - [ ] Flujo de aceptación de invitación
   - [ ] Dashboard de equipo

2. **Notificaciones**
   - [ ] Notificaciones en tiempo real (Supabase Realtime)
   - [ ] Push notifications (web)
   - [ ] Configuración de preferencias de notificación

3. **Exportación de Reportes**
   - [ ] Generar PDF de progreso
   - [ ] Filtros por fecha
   - [ ] Gráficos de tendencias
   - [ ] Compartir con médicos

4. **Upload de Imágenes**
   - [ ] Foto de perfil del niño
   - [ ] Fotos en registros diarios
   - [ ] Galería de momentos importantes

### Media Prioridad

5. **Objetivos Terapéuticos**
   - [ ] Definir objetivos por niño
   - [ ] Tracking de progreso en objetivos
   - [ ] Celebración de logros

6. **Calendario Visual**
   - [ ] Vista de calendario mensual
   - [ ] Días con registros marcados
   - [ ] Filtros por estado de ánimo

7. **Mensajería Directa**
   - [ ] Chat entre miembros del equipo
   - [ ] Hilos de conversación
   - [ ] Notificaciones de mensajes

8. **Rutinas Visuales**
   - [ ] Crear rutinas con imágenes
   - [ ] Secuencias de actividades
   - [ ] Checklist interactivo

### Baja Prioridad

9. **Biblioteca de Recursos**
   - [ ] Banco de actividades
   - [ ] Estrategias sensoriales
   - [ ] Artículos educativos

10. **Comunidad**
    - [ ] Foro de padres
    - [ ] Grupos por diagnóstico
    - [ ] Sistema de mentoría

## 🎨 Mejoras de UX/UI

- [ ] Modo oscuro
- [ ] Animaciones de transición
- [ ] Onboarding interactivo
- [ ] Feedback visual mejorado
- [ ] Shortcuts de teclado
- [ ] Accesibilidad (WCAG 2.1 AA)

## 🔧 Mejoras Técnicas

### Performance
- [ ] Image optimization (Next/Image)
- [ ] Code splitting mejorado
- [ ] Lazy loading de componentes
- [ ] Service Worker para offline
- [ ] Caching strategies

### Seguridad
- [ ] Rate limiting
- [ ] CAPTCHA en registro
- [ ] 2FA (opcional)
- [ ] Audit logs
- [ ] Encriptación de datos sensibles

### Testing
- [ ] Unit tests (Jest + RTL)
- [ ] Integration tests (Playwright)
- [ ] E2E tests críticos
- [ ] CI/CD pipeline

### Developer Experience
- [ ] TypeScript migration
- [ ] Prettier + ESLint config
- [ ] Husky pre-commit hooks
- [ ] Storybook para componentes
- [ ] API documentation

## 📊 Analytics y Métricas

- [ ] Google Analytics 4
- [ ] Mixpanel para eventos
- [ ] Hotjar para UX insights
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring

## 💡 Ideas Futuras (Backlog)

### Integraciones
- [ ] Google Calendar
- [ ] Zoom/Meet para sesiones
- [ ] WhatsApp notifications
- [ ] Integración con EHR

### AI/ML Features
- [ ] Sugerencias automáticas de actividades
- [ ] Detección de patrones en comportamiento
- [ ] Predicción de desafíos
- [ ] Asistente virtual

### Gamificación
- [ ] Sistema de logros
- [ ] Badges para padres y niños
- [ ] Retos semanales
- [ ] Celebraciones de hitos

### Mobile Native
- [ ] App iOS (React Native)
- [ ] App Android (React Native)
- [ ] Widgets nativos
- [ ] Offline-first

## 📝 Notas de Implementación

### Sistema de Invitaciones (v0.2)

**Archivo a crear:** `app/api/invitar/route.js`

```javascript
import { createClient } from '@supabase/supabase-js'

// Usar Service Role Key (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const { email, ninoId, rol, permisos } = await request.json()
  
  // Invitar usuario
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    email,
    {
      data: { nino_id: ninoId, rol, permisos },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    }
  )
  
  return Response.json({ data, error })
}
```

### Notificaciones Push (v0.2)

**Archivo a crear:** `lib/notifications.js`

```javascript
export async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY
  })
  
  // Guardar subscription en Supabase
  await supabase.from('push_subscriptions').insert({ subscription })
}
```

### Exportar PDF (v0.2)

```bash
npm install jspdf jspdf-autotable
```

**Archivo a crear:** `lib/pdf-export.js`

```javascript
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export function exportarProgreso(registros, nino) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.text(`Reporte de Progreso - ${nino.nombre}`, 20, 20)
  
  // Tabla de registros
  doc.autoTable({
    head: [['Fecha', 'Estado', 'Logros', 'Desafíos']],
    body: registros.map(r => [
      r.fecha,
      r.estado_animo,
      r.logros,
      r.desafios
    ])
  })
  
  doc.save(`progreso-${nino.nombre}.pdf`)
}
```

## 🤝 Contribuir

### Setup para Desarrollo

```bash
# Clonar
git clone https://github.com/tu-usuario/coneccion-app.git

# Instalar
npm install

# Variables de entorno
cp .env.example .env.local
# Editar .env.local con tus keys

# Ejecutar schema
# Copia supabase/schema.sql en Supabase Dashboard

# Desarrollo
npm run dev
```

### Branches

- `main` - Producción
- `develop` - Staging
- `feature/*` - Nuevas funcionalidades
- `fix/*` - Bug fixes

### Commit Messages

Usa conventional commits:
```
feat: agregar notificaciones push
fix: corregir bug en timeline
docs: actualizar README
style: mejorar diseño de cards
refactor: optimizar queries
test: agregar tests para auth
```

## 📞 Contacto y Soporte

- GitHub Issues: Para bugs y features
- Discussions: Para ideas y preguntas
- Email: [tu-email] para soporte directo

---

**Última actualización:** Febrero 2025
**Versión actual:** 0.1.0-mvp
**Próxima release:** 0.2.0 (Q2 2025)
