import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const client = fs.readFileSync('src/cloud/supabaseClient.js', 'utf8')
const deployment = JSON.parse(fs.readFileSync('vercel.json', 'utf8'))
const globalHeaders = deployment.headers?.find((entry) => entry.source === '/(.*)')?.headers || []
const csp = globalHeaders.find((entry) => entry.key === 'Content-Security-Policy')?.value || ''

const EXPECTED_SUPABASE_VERSION = '2.111.0'
const CDN_URL = `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@${EXPECTED_SUPABASE_VERSION}/+esm`
const bundledVersion = packageJson.dependencies?.['@supabase/supabase-js'] || null

test('Supabase runtime dependency is either exactly pinned CDN or exactly pinned bundled dependency', () => {
  if (bundledVersion) {
    assert.equal(bundledVersion, EXPECTED_SUPABASE_VERSION)
    assert.match(client, /from ['"]@supabase\/supabase-js['"]/)
    assert.doesNotMatch(client, /cdn\.jsdelivr\.net/)
    assert.doesNotMatch(csp, /cdn\.jsdelivr\.net/)
    return
  }

  assert.match(client, new RegExp(CDN_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.match(csp, /script-src[^;]*https:\/\/cdn\.jsdelivr\.net/)
  assert.doesNotMatch(csp, /https:\/\/api\.openai\.com/)
})

test('Supabase SDK version reported to diagnostics matches the pinned runtime version', () => {
  assert.match(client, new RegExp(`sdkVersion:\\s*['"]${EXPECTED_SUPABASE_VERSION.replaceAll('.', '\\.') }['"]`))
})
