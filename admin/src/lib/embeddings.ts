export async function generateEmbedding(text: string): Promise<{ embedding: number[], usage: number }> {
  const apiKey = process.env.ROUTERAI_API_KEY
  if (!apiKey) {
    throw new Error('ROUTERAI_API_KEY is not set')
  }

  // Используем voyage-4-lite через OpenAI-совместимый API от routerai.ru
  const response = await fetch('https://routerai.ru/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: text,
      model: 'voyageai/voyage-4-lite' // RouterAI model ID for voyage 4 lite
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Failed to generate embedding: ${response.statusText} - ${err}`)
  }

  const data = await response.json()
  return { 
    embedding: data.data[0].embedding, 
    usage: data.usage?.total_tokens || 0 
  }
}
