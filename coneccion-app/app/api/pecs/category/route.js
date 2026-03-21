// Keyword de búsqueda en ARASAAC para cada categoría del sistema
// La API de ARASAAC no tiene endpoint de categorías — se usa búsqueda por keyword
const CATEGORY_KEYWORDS = {
  alimentacion: 'alimentacion',
  tiempo_libre:  'deporte',
  educativo:     'educacion',
  autonomia:     'rutina',
  social:        'social',
  atributos:     'adjetivo',
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')

  if (!categoryId || !CATEGORY_KEYWORDS[categoryId]) {
    return Response.json({ error: 'Categoría inválida' }, { status: 400 })
  }

  const keyword = CATEGORY_KEYWORDS[categoryId]

  try {
    const res = await fetch(
      `https://api.arasaac.org/v1/pictograms/es/search/${encodeURIComponent(keyword)}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return Response.json([])

    const data = await res.json()
    const normalized = (Array.isArray(data) ? data : []).slice(0, 60).map(p => ({
      id: p._id,
      label: p.keywords?.[0]?.keyword || keyword,
      imageUrl: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`,
      category: categoryId,
    }))
    return Response.json(normalized)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
