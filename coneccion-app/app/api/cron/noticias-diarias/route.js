import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  // Verificar autorización: Vercel envía el cron secret como Bearer token
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const hoy = new Date().toISOString().split('T')[0]

    // Obtener URLs de noticias ya guardadas para no repetir
    const { data: yaGuardadas } = await supabaseAdmin
      .from('noticias')
      .select('fuente_url')
    const urlsYaGuardadas = new Set((yaGuardadas || []).map(n => n.fuente_url).filter(Boolean))

    // Medios en español: México + EE.UU. en español
    const DOMINIOS_ES = [
      // México
      'milenio.com',
      'eluniversal.com.mx',
      'excelsior.com.mx',
      'jornada.com.mx',
      'informador.mx',
      'expansion.mx',
      'eleconomista.com.mx',
      'proceso.com.mx',
      'animalpolitico.com',
      'sinembargo.mx',
      // EE.UU. en español
      'univision.com',
      'telemundo.com',
      'laopinion.com',
      'mundohispanico.com',
      'elnuevoherald.com',
    ].join(',')

    // Llamar a NewsAPI con términos médicos/terapéuticos específicos
    const keywords = encodeURIComponent(
      '"terapia ocupacional" OR "terapia del lenguaje" OR "autismo infantil" OR "TDAH niños" OR "síndrome de Down" OR "neurodesarrollo" OR "terapia conductual" OR "discapacidad infantil" OR "intervención temprana" OR "TDAH" OR "Autismo" OR "Maestra sombra"'
    )
    const newsUrl = `https://newsapi.org/v2/everything?q=${keywords}&domains=${DOMINIOS_ES}&language=es&sortBy=publishedAt&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`

    // Respaldo 1: top headlines de México (country=mx)
    const newsUrlFallback1 = `https://newsapi.org/v2/top-headlines?q=${keywords}&country=mx&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`
    // Respaldo 2: búsqueda global en español sin restricción de dominio
    const newsUrlFallback2 = `https://newsapi.org/v2/everything?q=${keywords}&language=es&sortBy=publishedAt&pageSize=20&apiKey=${process.env.NEWS_API_KEY}`

    let newsRes = await fetch(newsUrl, { cache: 'no-store' })
    if (!newsRes.ok) throw new Error(`NewsAPI error: ${newsRes.status}`)

    let newsData = await newsRes.json()
    console.log(`[dominios MX+US-ES] totalResults: ${newsData.totalResults}, artículos: ${newsData.articles?.length}`)

    // Si no hay resultados en medios MX, buscar con country=mx como respaldo
    if (!newsData.articles?.length) {
      newsRes = await fetch(newsUrlFallback1, { cache: 'no-store' })
      if (newsRes.ok) {
        newsData = await newsRes.json()
        console.log(`[country=mx fallback] totalResults: ${newsData.totalResults}, artículos: ${newsData.articles?.length}`)
      }
    }

    // Si aún no hay resultados, buscar en español sin restricción de dominio
    if (!newsData.articles?.length) {
      newsRes = await fetch(newsUrlFallback2, { cache: 'no-store' })
      if (newsRes.ok) {
        newsData = await newsRes.json()
        console.log(`[global es fallback] totalResults: ${newsData.totalResults}, artículos: ${newsData.articles?.length}`)
      }
    }

    // Palabras que indican que la noticia NO es relevante
    const PALABRAS_EXCLUIDAS = [
      /*'huelga', 'sindicato', 'protesta', 'manifestación', 'elecciones',
      'partido', 'político', 'gobierno', 'deuda', 'presupuesto', 'fiscal',
      'fútbol', 'deporte', 'economía', 'bolsa', 'mercado',*/
    ]

    const articulos = (newsData.articles || []).filter((a) => {
      if (!a.title || a.title.includes('[Removed]')) return false
      if (urlsYaGuardadas.has(a.url)) return false
      const texto = `${a.title} ${a.description || ''}`.toLowerCase()
      return !PALABRAS_EXCLUIDAS.some((p) => texto.includes(p))
    })

    const sinImagen = (newsData.articles || []).filter(a => !a.urlToImage).length
    const yaGuardadasCount = (newsData.articles || []).filter(a => urlsYaGuardadas.has(a.url)).length
    console.log(`[filtro] artículos que pasaron: ${articulos.length} | sin imagen: ${sinImagen} | ya guardadas: ${yaGuardadasCount}`)
    console.log('[títulos disponibles]', (newsData.articles || []).map(a => ({ title: a.title, hasImage: !!a.urlToImage })))

    if (!articulos.length) {
      return Response.json({ error: 'No se encontraron artículos nuevos', totalRecibidos: newsData.articles?.length || 0 }, { status: 404 })
    }

    const articulo = articulos[0]

    // Descargar la imagen y subirla a Supabase Storage
    const IMAGEN_DEFAULT = 'https://pulsoazul.com/pulsoazulDefaultNoticias.png'
    let imagenUrl = articulo.urlToImage || IMAGEN_DEFAULT
    try {
      if (!articulo.urlToImage) throw new Error('sin imagen original')
      const imgRes = await fetch(articulo.urlToImage)
      if (imgRes.ok) {
        const imgBuffer = await imgRes.arrayBuffer()
        const contentType = imgRes.headers.get('content-type') || 'image/jpeg'
        const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
        const nombreArchivo = `${hoy}-${Date.now()}.${ext}`

        const { error: uploadError } = await supabaseAdmin.storage
          .from('noticias-imagenes')
          .upload(nombreArchivo, imgBuffer, { contentType, cacheControl: '86400' })

        if (!uploadError) {
          const { data: publicData } = supabaseAdmin.storage
            .from('noticias-imagenes')
            .getPublicUrl(nombreArchivo)
          imagenUrl = publicData.publicUrl
        }
      }
    } catch (imgErr) {
      console.warn('No se pudo subir la imagen, usando URL original:', imgErr.message)
    }

    // Construir contenido HTML
    const contenidoHtml = `
<p>${articulo.description || ''}</p>
${articulo.content ? `<p>${articulo.content.replace(/\[\+\d+ chars\]$/, '').trim()}</p>` : ''}
<p class="fuente">
  Fuente: <a href="${articulo.url}" target="_blank" rel="noopener noreferrer">${articulo.source?.name || 'Ver artículo completo'}</a>
</p>
`.trim()

    // Insertar en la base de datos
    const { data: noticia, error: insertError } = await supabaseAdmin
      .from('noticias')
      .insert({
        titulo: articulo.title,
        resumen: articulo.description,
        contenido: contenidoHtml,
        imagen_url: imagenUrl,
        fuente_url: articulo.url,
        fuente_nombre: articulo.source?.name,
        fecha_publicacion: hoy,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Enviar push notification a todos los usuarios
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pulsoazul.com'
    /*
    await fetch(`${appUrl}/api/notificar-noticia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noticiaId: noticia.id, titulo: noticia.titulo }),
    })
    */
    return Response.json({ ok: true, noticiaId: noticia.id, titulo: noticia.titulo })
  } catch (err) {
    console.error('Error en cron noticias-diarias:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
