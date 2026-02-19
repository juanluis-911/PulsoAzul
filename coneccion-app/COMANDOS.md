# Comandos Útiles - Conección App

## 🚀 Comandos de Desarrollo

### Setup Inicial
```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local

# Editar variables
nano .env.local  # o tu editor preferido
```

### Desarrollo
```bash
# Servidor de desarrollo
npm run dev

# Servidor en otro puerto
PORT=3001 npm run dev

# Ver en red local
npm run dev -- -H 0.0.0.0
```

### Build y Producción
```bash
# Build para producción
npm run build

# Correr build local
npm start

# Verificar build
npm run build && npm start
```

### Linting y Formato
```bash
# Lint
npm run lint

# Fix automático
npm run lint -- --fix
```

## 🗄️ Comandos de Supabase

### CLI Setup (Opcional)
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Inicializar proyecto local
supabase init

# Link a proyecto remoto
supabase link --project-ref tu-proyecto-ref
```

### Database
```bash
# Generar tipos de TypeScript
supabase gen types typescript --project-id tu-proyecto > types/supabase.ts

# Reset database (¡CUIDADO!)
# Solo en proyecto local
supabase db reset

# Aplicar migraciones
supabase db push
```

### Funciones útiles SQL

**Ver todas las políticas RLS:**
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

**Contar registros por tabla:**
```sql
SELECT 
  'ninos' as tabla, COUNT(*) as total FROM ninos
UNION ALL
SELECT 'registros_diarios', COUNT(*) FROM registros_diarios
UNION ALL
SELECT 'equipo_terapeutico', COUNT(*) FROM equipo_terapeutico
UNION ALL
SELECT 'perfiles', COUNT(*) FROM perfiles;
```

**Ver usuarios registrados:**
```sql
SELECT id, email, created_at, raw_user_meta_data 
FROM auth.users 
ORDER BY created_at DESC;
```

**Registros recientes:**
```sql
SELECT 
  r.fecha,
  n.nombre || ' ' || n.apellido as nino,
  r.estado_animo,
  r.logros,
  p.nombre_completo as creado_por
FROM registros_diarios r
JOIN ninos n ON r.nino_id = n.id
LEFT JOIN perfiles p ON r.creado_por = p.id
ORDER BY r.fecha DESC
LIMIT 10;
```

## 📦 Comandos de Git

### Workflow Básico
```bash
# Estado
git status

# Agregar cambios
git add .

# Commit
git commit -m "feat: descripción del cambio"

# Push
git push origin main

# Ver log
git log --oneline --graph --decorate --all
```

### Branches
```bash
# Crear y cambiar a nueva rama
git checkout -b feature/nueva-funcionalidad

# Cambiar de rama
git checkout develop

# Merge
git merge feature/nueva-funcionalidad

# Eliminar rama
git branch -d feature/nueva-funcionalidad
```

### Tips
```bash
# Ver cambios antes de commit
git diff

# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1

# Deshacer cambios en archivo
git checkout -- archivo.js

# Stash cambios temporalmente
git stash
git stash pop
```

## 🐛 Debugging

### Next.js
```bash
# Modo debug
NODE_OPTIONS='--inspect' npm run dev

# Limpiar caché de Next.js
rm -rf .next

# Ver variables de entorno
npm run dev -- --debug
```

### Logs útiles en código
```javascript
// Server Component
console.log('Server log:', data)

// Client Component
console.log('Client log:', data)

// Supabase query debug
const { data, error } = await supabase
  .from('tabla')
  .select()
  .then(res => {
    console.log('Query result:', res)
    return res
  })
```

## 📊 Performance

### Analizar Bundle
```bash
# Instalar analyzer
npm install @next/bundle-analyzer

# Analizar
ANALYZE=true npm run build
```

### Lighthouse CI
```bash
# Instalar
npm install -g @lhci/cli

# Correr audit
lhci autorun --config=lighthouserc.json
```

## 🔍 Testing (cuando implementes)

### Jest
```bash
# Correr tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Playwright
```bash
# Instalar
npm create playwright

# Correr tests
npx playwright test

# UI mode
npx playwright test --ui
```

## 🔐 Seguridad

### Verificar dependencias
```bash
# Audit
npm audit

# Fix automático
npm audit fix

# Ver detalles
npm audit --json
```

### Actualizar dependencias
```bash
# Ver outdated
npm outdated

# Actualizar a latest
npm update

# Actualizar específica
npm install package-name@latest
```

## 📱 PWA Testing

### Local Testing
```bash
# Build
npm run build

# Servir con HTTPS (requerido para PWA)
npx serve out -s --ssl-cert cert.pem --ssl-key key.pem
```

### Generar certificados locales
```bash
# macOS
brew install mkcert
mkcert -install
mkcert localhost

# Linux
# Instalar mkcert según tu distro
```

## 🎨 Componentes UI

### Agregar nuevo componente
```bash
# Estructura recomendada
touch components/ui/NuevoComponente.jsx
```

```javascript
// Template básico
import { cn } from '@/lib/utils'

export function NuevoComponente({ className, ...props }) {
  return (
    <div className={cn('base-classes', className)} {...props}>
      {/* contenido */}
    </div>
  )
}
```

## 🚢 Deployment Quick Commands

### Vercel
```bash
# Instalar CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy a producción
vercel --prod

# Ver logs
vercel logs
```

### GitHub Actions (futuro)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - uses: amondnet/vercel-action@v20
```

## 📝 Snippets Útiles

### Crear nueva página
```javascript
// app/nueva-pagina/page.jsx
export default function NuevaPaginaPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4">
        <h1>Nueva Página</h1>
      </div>
    </div>
  )
}
```

### Fetch de Supabase (Server)
```javascript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from('tabla')
    .select('*')
  
  return <div>{/* usar data */}</div>
}
```

### Fetch de Supabase (Client)
```javascript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Component() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    const supabase = createClient()
    
    supabase
      .from('tabla')
      .select('*')
      .then(({ data }) => setData(data))
  }, [])
  
  return <div>{/* usar data */}</div>
}
```

## 💡 Tips Pro

1. **Hot Reload Issues**
   ```bash
   # Si hot reload no funciona
   rm -rf .next
   npm run dev
   ```

2. **Port Already in Use**
   ```bash
   # Matar proceso en puerto 3000
   lsof -ti:3000 | xargs kill -9
   ```

3. **Clear Everything**
   ```bash
   # Reset completo
   rm -rf node_modules .next
   npm install
   npm run dev
   ```

4. **Environment Variables Not Loading**
   ```bash
   # Asegurar que .env.local existe
   # Reiniciar servidor después de cambiar .env
   # Verificar NEXT_PUBLIC_ prefix para cliente
   ```

5. **Supabase Connection Issues**
   ```javascript
   // Verificar conexión
   const { data, error } = await supabase.from('ninos').select('count')
   console.log('Connection test:', { data, error })
   ```

## 🔗 Links Útiles

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [React Docs](https://react.dev)
- [Vercel Docs](https://vercel.com/docs)

---

💡 **Pro Tip:** Guarda este archivo como referencia rápida. Agrégalo a tus bookmarks!
