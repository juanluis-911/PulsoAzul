import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { ChevronLeft, ExternalLink, Newspaper } from 'lucide-react'

function formatearFechaNoticia(fecha) {
  const d = new Date(fecha + 'T12:00:00')
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function NoticiaDetallePage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/auth/login')

  const { data: noticia } = await supabase
    .from('noticias')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!noticia) notFound()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar user={user} />

      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="max-w-2xl mx-auto px-4 md:px-8 py-6 pb-12">

          {/* Volver */}
          <Link
            href="/noticias"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 mb-5 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver a noticias
          </Link>

          <article className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Imagen */}
            {noticia.imagen_url && (
              <div className="w-full aspect-video bg-slate-100 overflow-hidden">
                <Image
                  src={noticia.imagen_url}
                  alt={noticia.titulo}
                  width={800}
                  height={450}
                  className="w-full h-full object-cover"
                  unoptimized
                  priority
                />
              </div>
            )}

            <div className="p-5">
              {/* Meta */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Newspaper className="w-3.5 h-3.5 text-primary-500" />
                </div>
                <p className="text-xs text-slate-500 capitalize">
                  {formatearFechaNoticia(noticia.fecha_publicacion)}
                  {noticia.fuente_nombre && (
                    <span className="text-slate-400"> · {noticia.fuente_nombre}</span>
                  )}
                </p>
              </div>

              {/* Título */}
              <h1 className="text-xl font-bold text-slate-900 leading-snug mb-4">
                {noticia.titulo}
              </h1>

              {/* Contenido HTML */}
              {noticia.contenido && (
                <div
                  className="prose prose-sm prose-slate max-w-none
                             prose-p:text-slate-600 prose-p:leading-relaxed
                             prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline"
                  dangerouslySetInnerHTML={{ __html: noticia.contenido }}
                />
              )}

              {/* Link al artículo original */}
              {noticia.fuente_url && (
                <a
                  href={noticia.fuente_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-primary-600
                             hover:text-primary-700 border border-primary-200 hover:border-primary-300
                             px-4 py-2 rounded-xl transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Leer artículo completo
                </a>
              )}
            </div>
          </article>

        </div>
      </main>
    </div>
  )
}
