import { randomUUID } from 'node:crypto'

const DEFAULT_WINDOW_MS = 60_000
const DEFAULT_LIMIT = 20
const MAX_BUCKETS = 2_000

const buckets = globalThis.__speechCoachApiRateBuckets || new Map()
globalThis.__speechCoachApiRateBuckets = buckets

const headerValue = (request, name) => {
  const value = request?.headers?.[name] ?? request?.headers?.[name.toLowerCase()]
  return Array.isArray(value) ? value[0] : value
}

const normalizeOrigin = (value) => {
  if (!value) return ''
  try {
    return new URL(String(value)).origin
  } catch {
    return ''
  }
}

const configuredOrigins = () => String(process.env.SPEECHCOACH_ALLOWED_ORIGINS || '')
  .split(',')
  .map((value) => normalizeOrigin(value.trim()))
  .filter(Boolean)

const requestOrigin = (request) => normalizeOrigin(headerValue(request, 'origin'))

const inferredOrigin = (request) => {
  const host = String(headerValue(request, 'x-forwarded-host') || headerValue(request, 'host') || '').trim()
  if (!host) return ''
  const protocol = String(headerValue(request, 'x-forwarded-proto') || 'https').split(',')[0].trim() || 'https'
  return normalizeOrigin(`${protocol}://${host}`)
}

const isOriginAllowed = (request) => {
  const origin = requestOrigin(request)
  if (!origin) return true

  const explicit = configuredOrigins()
  if (explicit.includes(origin)) return true

  const sameOrigin = inferredOrigin(request)
  return Boolean(sameOrigin && origin === sameOrigin)
}

const clientKey = (request) => {
  const forwarded = String(headerValue(request, 'x-forwarded-for') || '').split(',')[0].trim()
  return forwarded
    || String(headerValue(request, 'x-real-ip') || '').trim()
    || String(request?.socket?.remoteAddress || '').trim()
    || 'unknown'
}

const pruneBuckets = (now) => {
  if (buckets.size < MAX_BUCKETS) return
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key)
  }
  while (buckets.size > MAX_BUCKETS) {
    const oldest = buckets.keys().next().value
    if (!oldest) break
    buckets.delete(oldest)
  }
}

const consumeRateLimit = (request, scope, limit, windowMs) => {
  const now = Date.now()
  pruneBuckets(now)
  const key = `${scope}:${clientKey(request)}`
  const current = buckets.get(key)

  if (!current || now >= current.resetAt) {
    const next = { count: 1, resetAt: now + windowMs }
    buckets.set(key, next)
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: next.resetAt }
  }

  current.count += 1
  buckets.set(key, current)
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  }
}

const estimateBodyBytes = (request) => {
  const contentLength = Number(headerValue(request, 'content-length'))
  if (Number.isFinite(contentLength) && contentLength >= 0) return contentLength
  try {
    if (typeof request?.body === 'string') return Buffer.byteLength(request.body, 'utf8')
    if (request?.body && typeof request.body === 'object') return Buffer.byteLength(JSON.stringify(request.body), 'utf8')
  } catch {
    return Number.POSITIVE_INFINITY
  }
  return 0
}

export const applyApiResponseHeaders = (response, requestId = randomUUID()) => {
  response.setHeader('Cache-Control', 'no-store, max-age=0')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'no-referrer')
  response.setHeader('X-Request-Id', requestId)
  return requestId
}

export const guardApiRequest = (request, response, {
  methods = ['POST'],
  maxBodyBytes = 64 * 1024,
  requireJson = true,
  rateLimit = DEFAULT_LIMIT,
  rateWindowMs = DEFAULT_WINDOW_MS,
  scope = 'default',
} = {}) => {
  const requestId = applyApiResponseHeaders(response)

  if (!methods.includes(request.method)) {
    response.setHeader('Allow', methods.join(', '))
    response.status(405).json({ error: 'Method not allowed', requestId })
    return { ok: false, requestId }
  }

  if (!isOriginAllowed(request)) {
    response.status(403).json({ error: 'Origin not allowed', requestId })
    return { ok: false, requestId }
  }

  if (estimateBodyBytes(request) > maxBodyBytes) {
    response.status(413).json({ error: 'Request body too large', requestId })
    return { ok: false, requestId }
  }

  if (requireJson && request.method !== 'GET') {
    const contentType = String(headerValue(request, 'content-type') || '').toLowerCase()
    if (contentType && !contentType.includes('application/json')) {
      response.status(415).json({ error: 'Content-Type must be application/json', requestId })
      return { ok: false, requestId }
    }
  }

  const rate = consumeRateLimit(request, scope, rateLimit, rateWindowMs)
  response.setHeader('X-RateLimit-Limit', String(rateLimit))
  response.setHeader('X-RateLimit-Remaining', String(rate.remaining))
  response.setHeader('X-RateLimit-Reset', String(Math.ceil(rate.resetAt / 1000)))

  if (!rate.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))
    response.setHeader('Retry-After', String(retryAfter))
    response.status(429).json({ error: 'Too many requests', requestId })
    return { ok: false, requestId }
  }

  return { ok: true, requestId }
}

export const clearApiRateLimitsForTests = () => buckets.clear()
