import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const deployment = JSON.parse(fs.readFileSync('vercel.json', 'utf8'))
const globalHeaders = deployment.headers?.find((entry) => entry.source === '/(.*)')?.headers || []
const headers = Object.fromEntries(globalHeaders.map((entry) => [entry.key.toLowerCase(), entry.value]))

test('production header contract includes CSP and opener isolation', () => {
  assert.equal(headers['x-content-type-options'], 'nosniff')
  assert.equal(headers['x-frame-options'], 'DENY')
  assert.equal(headers['cross-origin-opener-policy'], 'same-origin')
  assert.equal(headers['x-permitted-cross-domain-policies'], 'none')

  const csp = headers['content-security-policy'] || ''
  assert.match(csp, /default-src 'self'/)
  assert.match(csp, /object-src 'none'/)
  assert.match(csp, /frame-ancestors 'none'/)
  assert.match(csp, /base-uri 'self'/)
  assert.match(csp, /https:\/\/cdn\.jsdelivr\.net/)
  assert.match(csp, /https:\/\/\*\.supabase\.co/)
  assert.doesNotMatch(csp, /https:\/\/api\.openai\.com/)
})
