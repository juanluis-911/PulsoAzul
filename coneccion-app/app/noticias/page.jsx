import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { ChevronRight, Newspaper } from 'lucide-react'

function formatearFechaNoticia(fecha) {
  const d = new Date(fecha + 'T12:00:00')
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function NoticiasPage() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/auth/login')

  const { data: noticias } = await supabase
    .from('noticias')
    .select('id, titulo, resumen, imagen_url, fuente_nombre, fecha_publicacion')
    .order('fecha_publicacion', { ascending: false })
    .limit(30)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {/* Encabezado */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-sky-400 px-5 pt-6 pb-8 md:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Noticias</h1>
            </div>
            <p className="text-primary-100 text-sm">
              Artículos diarios sobre salud infantil, terapia y educación especial
            </p>
          </div>
        </div>

        {/* Lista de noticias */}
        <div className="px-4 md:px-8 -mt-4 max-w-2xl mx-auto md:max-w-3xl pb-10">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {!noticias?.length ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <span className="text-4xl mb-3">📰</span>
                <p className="text-slate-500 text-sm">
                  Aún no hay noticias publicadas. Vuelve mañana.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {noticias.map((noticia) => (
                  <Link
                    key={noticia.id}
                    href={`/noticias/${noticia.id}`}
                    className="flex gap-4 p-4 hover:bg-slate-50 transition-colors group"
                  >
                    {/* Imagen */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                      {noticia.imagen_url ? (
                        <Image
                          src={noticia.imagen_url}
                          alt={noticia.titulo}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-primary-500 font-medium mb-1">
                        {formatearFechaNoticia(noticia.fecha_publicacion)}
                        {noticia.fuente_nombre && (
                          <span className="text-slate-400"> · {noticia.fuente_nombre}</span>
                        )}
                      </p>
                      <h3 className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
                        {noticia.titulo}
                      </h3>
                      {noticia.resumen && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-snug">
                          {noticia.resumen}
                        </p>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary-400 transition-colors shrink-0 self-center" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
