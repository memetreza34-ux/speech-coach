import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const fail = (message) => {
  console.error(`SMOKE CHECK FAILED: ${message}`)
  process.exitCode = 1
}
const expect = (condition, message) => {
  if (!condition) fail(message)
}

const requiredFiles = [
  'src/RootApp.jsx',
  'src/AudioStudioPro.jsx',
  'src/ConversationCoach.jsx',
  'src/TeamCoach.jsx',
  'src/TrainingPlanCenter.jsx',
  'src/ErrorBoundary.jsx',
  'api/_security.js',
  'api/health.js',
  'api/coach.js',
  'api/team-coach.js',
  'api/transcribe.js',
  'docs/API_SECURITY.md',
  'docs/PRODUCTION_CHECKLIST.md',
  'supabase/speechcoach-cloud.sql',
  'vercel.json',
]

for (const file of requiredFiles) {
  expect(fs.existsSync(path.join(root, file)), `required file missing: ${file}`)
}

const rootApp = read('src/RootApp.jsx')
expect(rootApp.includes("import AudioStudio from './AudioStudioPro.jsx'"), 'AudioStudioPro is not the active audio studio')
expect(rootApp.includes("import TeamCoach from './TeamCoach.jsx'"), 'TeamCoach is not wired into RootApp')

const main = read('src/main.jsx')
expect(main.includes('ErrorBoundary'), 'global ErrorBoundary is not mounted')

const audioStudio = read('src/AudioStudioPro.jsx')
const savedSessionStart = audioStudio.indexOf('saveSession({')
const savedSessionEnd = audioStudio.indexOf('onComplete({', savedSessionStart)
const persistedAudioBlock = savedSessionStart >= 0 && savedSessionEnd > savedSessionStart
  ? audioStudio.slice(savedSessionStart, savedSessionEnd)
  : ''
expect(Boolean(persistedAudioBlock), 'could not inspect AudioStudioPro persisted session payload')
expect(!persistedAudioBlock.includes('audioUrl'), 'audioUrl must never be persisted in audio history')
expect(!persistedAudioBlock.includes('preciseTranscription'), 'word timestamps must never be persisted in audio history')

const cloudSync = read('src/cloud/cloudSync.js')
expect(cloudSync.includes("if (key === 'audioUrl'"), 'cloud payload scrubber must remove audioUrl')

const apiSecurity = read('api/_security.js')
expect(apiSecurity.includes("'Cache-Control', 'no-store, max-age=0'"), 'API guard must disable caching')
expect(apiSecurity.includes("'X-Content-Type-Options', 'nosniff'"), 'API guard must set nosniff')
expect(apiSecurity.includes("'X-Request-Id'"), 'API guard must attach request IDs')
expect(apiSecurity.includes("'X-RateLimit-Limit'"), 'API guard must expose rate limit metadata')
expect(apiSecurity.includes("response.status(429)"), 'API guard must reject excessive requests')
expect(apiSecurity.includes('SPEECHCOACH_ALLOWED_ORIGINS'), 'API guard must support an explicit deployment origin allowlist')

for (const endpoint of ['api/coach.js', 'api/team-coach.js', 'api/transcribe.js']) {
  const content = read(endpoint)
  expect(content.includes("from './_security.js'"), `${endpoint} does not import the shared API guard`)
  expect(content.includes('guardApiRequest('), `${endpoint} does not execute the shared API guard`)
  expect(content.includes('process.env.OPENAI_API_KEY'), `${endpoint} must use server-side OPENAI_API_KEY`)
}

const transcribe = read('api/transcribe.js')
expect(transcribe.includes("form.append('model', 'whisper-1')"), 'timestamp transcription model changed unexpectedly')
expect(transcribe.includes("form.append('timestamp_granularities[]', 'word')"), 'word timestamps are not requested')
expect(transcribe.includes('rateLimit: 6'), 'transcription endpoint should retain the stricter request limit')

const apiSecurityDocs = read('docs/API_SECURITY.md')
expect(apiSecurityDocs.includes('Produktions-WAF'), 'API security documentation must require a production WAF/distributed limiter')
expect(apiSecurityDocs.includes('keine globale Rate-Limit-Garantie'), 'API security docs must state the in-memory limiter limitation')

const health = read('api/health.js')
expect(health.includes("status: 'ok'"), 'health endpoint does not expose a stable ok status')
expect(health.includes("response.setHeader('Cache-Control', 'no-store, max-age=0')"), 'health endpoint must disable caching')

const deployment = JSON.parse(read('vercel.json'))
const globalHeaders = deployment.headers?.find((entry) => entry.source === '/(.*)')?.headers || []
const headerKeys = new Set(globalHeaders.map((header) => header.key))
for (const requiredHeader of ['X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy', 'Strict-Transport-Security']) {
  expect(headerKeys.has(requiredHeader), `missing production response header: ${requiredHeader}`)
}

const sourceFiles = [
  'src/RootApp.jsx',
  'src/AudioStudioPro.jsx',
  'src/cloud/cloudSync.js',
  'src/cloud/supabaseClient.js',
  'api/_security.js',
  'api/health.js',
  'api/coach.js',
  'api/team-coach.js',
  'api/transcribe.js',
]
for (const file of sourceFiles) {
  const content = read(file)
  expect(!/VITE_OPENAI_API_KEY/.test(content), `${file} contains forbidden browser OpenAI key reference`)
  expect(!/sk-(?:proj-)?[A-Za-z0-9_-]{20,}/.test(content), `${file} appears to contain an OpenAI secret`)
}

const syntaxFiles = [
  'api/_security.js',
  'api/health.js',
  'api/coach.js',
  'api/team-coach.js',
  'api/transcribe.js',
  'src/audioAnalysis.js',
  'src/pitchAnalysis.js',
  'src/serverTranscription.js',
  'src/trainingPlanEngine.js',
  'src/trainingPlanStore.js',
]

for (const file of syntaxFiles) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' })
  if (result.status !== 0) fail(`syntax check failed for ${file}: ${result.stderr.trim()}`)
}

if (!process.exitCode) console.log('SpeechCoach repository smoke checks passed.')
