const rawTarget = process.env.SPEECHCOACH_TARGET_URL || process.argv[2]
const expectAiConfigured = ['1', 'true', 'yes'].includes(String(process.env.EXPECT_AI_CONFIGURED || '').toLowerCase())
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS) || 12_000

if (!rawTarget) {
  console.error('Usage: SPEECHCOACH_TARGET_URL=https://speechcoach.example npm run test:deployment')
  process.exit(2)
}

let target
try {
  target = new URL(rawTarget)
} catch {
  console.error('Invalid SPEECHCOACH_TARGET_URL.')
  process.exit(2)
}

if (!['https:', 'http:'].includes(target.protocol)) {
  console.error('Target URL must use HTTP or HTTPS.')
  process.exit(2)
}

if (target.protocol !== 'https:' && !['localhost', '127.0.0.1', '::1'].includes(target.hostname)) {
  console.error('Remote deployment smoke tests require HTTPS.')
  process.exit(2)
}

target.pathname = target.pathname.replace(/\/$/, '')
target.search = ''
target.hash = ''

const failures = []
const passes = []
const base = target.toString().replace(/\/$/, '')

const check = (condition, label, detail = '') => {
  if (condition) passes.push(label)
  else failures.push(detail ? `${label}: ${detail}` : label)
}

const request = async (pathname, options = {}) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(`${base}${pathname}`, {
      redirect: 'manual',
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timer)
  }
}

const getJson = async (response) => {
  try {
    return await response.json()
  } catch {
    return null
  }
}

const root = await request('/')
check(root.status === 200, 'Startseite liefert HTTP 200', `Status ${root.status}`)
check((root.headers.get('content-type') || '').includes('text/html'), 'Startseite liefert HTML')
check((root.headers.get('x-content-type-options') || '').toLowerCase() === 'nosniff', 'nosniff ist aktiv')
check((root.headers.get('x-frame-options') || '').toUpperCase() === 'DENY', 'Clickjacking-Schutz ist aktiv')
check(Boolean(root.headers.get('referrer-policy')), 'Referrer-Policy ist gesetzt')
check(Boolean(root.headers.get('permissions-policy')), 'Permissions-Policy ist gesetzt')
if (target.protocol === 'https:') check(Boolean(root.headers.get('strict-transport-security')), 'HSTS ist aktiv')

const html = await root.text()
check(/<div[^>]+id=["']root["']/.test(html), 'React-Root ist im HTML vorhanden')

const assetMatch = html.match(/(?:src|href)=["']([^"']*\/assets\/[^"']+\.(?:js|css))["']/)
if (assetMatch) {
  const assetUrl = new URL(assetMatch[1], `${base}/`)
  const assetResponse = await fetch(assetUrl, { signal: AbortSignal.timeout(timeoutMs) })
  const cache = assetResponse.headers.get('cache-control') || ''
  check(assetResponse.ok, 'Gebautes Asset ist erreichbar', `Status ${assetResponse.status}`)
  check(/immutable/i.test(cache) && /max-age=31536000/i.test(cache), 'Gebautes Asset wird immutable gecacht', cache || 'kein Cache-Control')
} else {
  failures.push('Kein gebautes JS/CSS-Asset im HTML gefunden')
}

const healthResponse = await request('/api/health')
const health = await getJson(healthResponse)
check(healthResponse.status === 200, '/api/health liefert HTTP 200', `Status ${healthResponse.status}`)
check(health?.status === 'ok', '/api/health meldet status=ok')
check(health?.service === 'speechcoach', '/api/health meldet service=speechcoach')
check((healthResponse.headers.get('cache-control') || '').includes('no-store'), 'Health wird nicht gecacht')
check(!JSON.stringify(health || {}).includes('OPENAI_API_KEY'), 'Health gibt keinen Secret-Namen aus')
if (expectAiConfigured) {
  check(health?.capabilities?.aiCoachConfigured === true, 'OpenAI ist im Deployment konfiguriert')
}

for (const pathname of ['/api/coach', '/api/team-coach', '/api/transcribe']) {
  const response = await request(pathname, { method: 'GET' })
  check(response.status === 405, `${pathname} lehnt GET mit 405 ab`, `Status ${response.status}`)
  check((response.headers.get('allow') || '').includes('POST'), `${pathname} nennt POST im Allow-Header`)
  check(Boolean(response.headers.get('x-request-id')), `${pathname} liefert X-Request-Id`)
  check((response.headers.get('cache-control') || '').includes('no-store'), `${pathname} wird nicht gecacht`)
}

for (const pathname of ['/api/coach', '/api/team-coach', '/api/transcribe']) {
  const response = await request(pathname, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://foreign-origin.invalid',
    },
    body: '{}',
  })
  check(response.status === 403, `${pathname} blockiert fremden Origin`, `Status ${response.status}`)
  const payload = await getJson(response)
  check(Boolean(payload?.requestId), `${pathname} liefert Request-ID im 403-Body`)
}

const wrongType = await request('/api/coach', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain' },
  body: 'test',
})
check(wrongType.status === 415, '/api/coach lehnt falschen Content-Type mit 415 ab', `Status ${wrongType.status}`)

const oversized = await request('/api/coach', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ padding: 'x'.repeat(70 * 1024) }),
})
check(oversized.status === 413, '/api/coach lehnt übergroßen Body mit 413 ab', `Status ${oversized.status}`)

for (const label of passes) console.log(`PASS  ${label}`)
for (const failure of failures) console.error(`FAIL  ${failure}`)

console.log(`\nDeployment smoke: ${passes.length} bestanden, ${failures.length} fehlgeschlagen.`)
if (failures.length) process.exit(1)
