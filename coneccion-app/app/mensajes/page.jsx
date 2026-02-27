import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MessageCircle, ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

function calcularEdad(fechaNac) {
  if (!fechaNac) return null
  const hoy = new Date()
  const nac = new Date(fechaNac)
  let edad = hoy.getFullYear() - nac.getFullYear()
  if (hoy.getMonth() < nac.getMonth() ||
      (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--
  return edad
}

function formatTiempo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const hoy = new Date()
  if (d.toDateString() === hoy.toDateString())
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export default async function MensajesPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/auth/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol_principal, nombre_completo')
    .eq('id', user.id)
    .maybeSingle()

  const rol = perfil?.rol_principal ?? 'padre'

  // Obtener niños según rol
  let ninos = []
  if (rol === 'padre') {
    const { data } = await supabase
      .from('ninos')
      .select('id, nombre, apellido, fecha_nacimiento, foto_url, diagnostico')
      .eq('padre_id', user.id)
      .order('nombre')
    ninos = data ?? []
  } else {
    const { data } = await supabase
      .from('equipo_terapeutico')
      .select('ninos (id, nombre, apellido, fecha_nacimiento, foto_url, diagnostico)')
      .eq('usuario_id', user.id)
    ninos = data?.map(e => e.ninos).filter(Boolean) ?? []
  }

  // Para cada niño: último mensaje + conteo de no leídos
  const ninosConDatos = await Promise.all(
    ninos.map(async (nino) => {
      const [{ data: ultimoArr }, { count: noLeidos }] = await Promise.all([
        supabase
          .from('mensajes')
          .select('contenido, created_at, autor_id, adjunto_tipo')
          .eq('nino_id', nino.id)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('mensajes')
          .select('id', { count: 'exact', head: true })
          .eq('nino_id', nino.id)
          .neq('autor_id', user.id)
          .not('leido_por', 'cs', `{${user.id}}`),
      ])
      return { ...nino, ultimo_mensaje: ultimoArr?.[0] ?? null, no_leidos: noLeidos ?? 0 }
    })
  )

  // Ordenar: primero con no leídos, luego por fecha
  ninosConDatos.sort((a, b) => {
    if (a.no_leidos > 0 && b.no_leidos === 0) return -1
    if (a.no_leidos === 0 && b.no_leidos > 0) return 1
    if (!a.ultimo_mensaje && !b.ultimo_mensaje) return 0
    if (!a.ultimo_mensaje) return 1
    if (!b.ultimo_mensaje) return -1
    return new Date(b.ultimo_mensaje.created_at) - new Date(a.ultimo_mensaje.created_at)
  })

  // Cargar nombres de autores
  const autorIds = [...new Set(ninosConDatos.map(n => n.ultimo_mensaje?.autor_id).filter(Boolean))]
  const { data: autores } = await supabase
    .from('perfiles').select('id, nombre_completo')
    .in('id', autorIds.length ? autorIds : [''])
  const autoresMap = Object.fromEntries(autores?.map(a => [a.id, a]) ?? [])

  const totalNoLeidos = ninosConDatos.reduce((s, n) => s + n.no_leidos, 0)

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-900 text-lg">Mensajes</h1>
            {totalNoLeidos > 0 && (
              <span className="min-w-[22px] h-5 px-1.5 rounded-full bg-red-500 text-white
                               text-[11px] font-bold flex items-center justify-center">
                {totalNoLeidos > 99 ? '99+' : totalNoLeidos}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">Chat del equipo por niño</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4">
        {ninosConDatos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-primary-400" />
            </div>
            <h2 className="font-semibold text-slate-700 mb-1">Sin conversaciones</h2>
            <p className="text-sm text-slate-400 max-w-xs">
              Cuando haya niños en tu equipo, aquí verás un chat por cada uno.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ninosConDatos.map(nino => {
              const ultimo        = nino.ultimo_mensaje
              const noLeidos      = nino.no_leidos
              const tieneNoLeidos = noLeidos > 0
              const autorNombre   = ultimo
                ? (ultimo.autor_id === user.id ? 'Tú' : autoresMap[ultimo.autor_id]?.nombre_completo?.split(' ')[0] ?? 'Equipo')
                : null
              const edad = calcularEdad(nino.fecha_nacimiento)

              let preview = ''
              if (ultimo) {
                if (ultimo.adjunto_tipo === 'imagen')   preview = '📷 Foto'
                else if (ultimo.adjunto_tipo === 'pdf') preview = '📄 Documento'
                else preview = ultimo.contenido ?? ''
              }

              return (
                <Link
                  key={nino.id}
                  href={`/mensajes/${nino.id}`}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all group
                    ${tieneNoLeidos
                      ? 'bg-white border-primary-200 shadow-md shadow-primary-50 hover:shadow-lg hover:border-primary-300'
                      : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-primary-200'
                    }`}
                >
                  {/* Avatar con punto rojo si hay no leídos */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-violet-500
                                    flex items-center justify-center text-white font-bold text-base overflow-hidden">
                      {nino.foto_url
                        ? <img src={nino.foto_url} alt="" className="w-full h-full object-cover" />
                        : nino.nombre?.charAt(0)}
                    </div>
                    {tieneNoLeidos && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full
                                       bg-red-500 border-2 border-white" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate ${tieneNoLeidos ? 'font-bold text-slate-900' : 'font-semibold text-slate-900'}`}>
                        {nino.nombre} {nino.apellido}
                      </p>
                      {ultimo && (
                        <span className={`text-[11px] shrink-0 ml-2 ${tieneNoLeidos ? 'text-primary-600 font-semibold' : 'text-slate-400'}`}>
                          {formatTiempo(ultimo.created_at)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      {nino.diagnostico && <p className="text-xs text-slate-400 truncate">{nino.diagnostico}</p>}
                      {edad !== null && (
                        <>
                          {nino.diagnostico && <span className="text-slate-300 shrink-0">·</span>}
                          <p className="text-xs text-slate-400 shrink-0">{edad} {edad === 1 ? 'año' : 'años'}</p>
                        </>
                      )}
                    </div>

                    {preview ? (
                      <p className={`text-xs truncate mt-1 ${tieneNoLeidos ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                        <span className={tieneNoLeidos ? 'font-bold' : 'font-medium'}>{autorNombre}:</span>{' '}{preview}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-1">Sin mensajes aún — ¡inicia la conversación!</p>
                    )}
                  </div>

                  {/* Badge número o chevron */}
                  <div className="shrink-0">
                    {tieneNoLeidos ? (
                      <span className="min-w-[22px] h-5 px-1.5 rounded-full bg-red-500 text-white
                                       text-[11px] font-bold flex items-center justify-center">
                        {noLeidos > 99 ? '99+' : noLeidos}
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-400 transition-colors" />
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}