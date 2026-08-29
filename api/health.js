export default function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET, HEAD')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  response.setHeader('Cache-Control', 'no-store, max-age=0')
  response.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (request.method === 'HEAD') return response.status(204).end()

  return response.status(200).json({
    status: 'ok',
    service: 'speechcoach',
    timestamp: new Date().toISOString(),
    capabilities: {
      aiCoachConfigured: Boolean(process.env.OPENAI_API_KEY),
      precisionTranscriptionConfigured: Boolean(process.env.OPENAI_API_KEY),
    },
  })
}
