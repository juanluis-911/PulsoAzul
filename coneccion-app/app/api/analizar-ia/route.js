// Tu código adaptado para SiliconFlow
export async function POST(request) {
  try {
    const { prompt } = await request.json()
    if (!prompt) return Response.json({ error: 'Prompt requerido' }, { status: 400 })

    const res = await fetch('https://api.siliconflow.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`, // ¡Regístrate gratis!
      },
      body: JSON.stringify({
        model: 'deepseek-ai/DeepSeek-V3', // Modelo DeepSeek en SiliconFlow
        max_tokens: 1500,
        messages: [
          { 
            role: 'system', 
            content: 'Eres un psicólogo especialista en neurodivergencia...' 
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
        temperature: 0.3,
      }),
    })

    const data = await res.json()
    if (!res.ok) return Response.json({ error: data.error?.message || 'Error de API' }, { status: res.status })

    const texto = data.choices?.[0]?.message?.content || ''
    return Response.json({ texto })

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}