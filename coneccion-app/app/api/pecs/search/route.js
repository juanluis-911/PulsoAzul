export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('q')?.trim()
  const category = searchParams.get('category') || 'atributos'

  if (!keyword) return Response.json([])

  try {
    const res = await fetch(
      `https://api.arasaac.org/v1/pictograms/es/search/${encodeURIComponent(keyword)}`,
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return Response.json([])

    const data = await res.json()
    const normalized = (Array.isArray(data) ? data : []).slice(0, 48).map(p => ({
      id: p._id,
      label: p.keywords?.[0]?.keyword || keyword,
      imageUrl: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`,
      category,
    }))
    return Response.json(normalized)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
