export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')

  if (!imageUrl || !imageUrl.startsWith('https://static.arasaac.org/')) {
    return new Response('Forbidden', { status: 403 })
  }

  try {
    const res = await fetch(imageUrl, { next: { revalidate: 86400 } })
    if (!res.ok) return new Response('Not found', { status: 404 })
    const blob = await res.arrayBuffer()
    return new Response(blob, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return new Response('Error fetching image', { status: 502 })
  }
}
