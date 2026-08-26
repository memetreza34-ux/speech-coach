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
  'src/accessibility.css',
  'src/requestLifecycle.js',
  'src/AudioStudioPro.jsx',
  'src/ConversationCoach.jsx',
  'src/TeamCoach.jsx',
  'src/TrainingLab.jsx',
  'src/training-lab.css',
  'src/PersonalizedPractice.jsx',
  'src/personalized-practice.css',
  'src/contentAnalysis.js',
  'src/baselineStore.js',
  'src/TrainingPlanCenter.jsx',
  'src/ErrorBoundary.jsx',
  'api/_security.js',
  'api/health.js',
  'api/coach.js',
  'api/team-coach.js',
  'api/transcribe.js',
  'docs/INDEX.md',
  'docs/MASTER_ROADMAP.md',
  'docs/PRODUCT_SPEC.md',
  'docs/AI_EVALUATION.md',
  'docs/LEGAL_DATA_RELEASE.md',
  'docs/OPERATIONS_RELEASE.md',
  'docs/ACCESSIBILITY.md',
  'docs/API_SECURITY.md',
  'docs/DEPLOYMENT.md',
  'docs/PITCH_CALIBRATION.md',
  'docs/PRODUCTION_CHECKLIST.md',
  'scripts/deployment-smoke.mjs',
  'scripts/validate-production-env.mjs',
  '.github/workflows/deployment-smoke.yml',
  'supabase/speechcoach-cloud.sql',
  'vercel.json',
]

for (const file of requiredFiles) {
  expect(fs.existsSync(path.join(root, file)), `required file missing: ${file}`)
}

const packageJson = JSON.parse(read('package.json'))
expect(packageJson.scripts?.['test:deployment'] === 'node scripts/deployment-smoke.mjs', 'deployment smoke npm script is missing or changed')
expect(packageJson.scripts?.['check:env'] === 'node scripts/validate-production-env.mjs', 'production environment validator npm script is missing or changed')

const deploymentWorkflow = read('.github/workflows/deployment-smoke.yml')
expect(deploymentWorkflow.includes('SPEECHCOACH_TARGET_URL'), 'deployment smoke workflow does not pass the target URL')
expect(deploymentWorkflow.includes('VERCEL_AUTOMATION_BYPASS_SECRET'), 'deployment smoke workflow lost protected-preview support')

const deploymentRunbook = read('docs/DEPLOYMENT.md')
expect(deploymentRunbook.includes('npm run test:deployment'), 'deployment runbook must document the remote smoke command')
expect(deploymentRunbook.includes('npm run check:env'), 'deployment runbook must document production environment validation')
expect(deploymentRunbook.includes('Supabase Auth URL Configuration'), 'deployment runbook must document Supabase redirect configuration')

const masterRoadmap = read('docs/MASTER_ROADMAP.md')
expect(masterRoadmap.includes('Training Lab'), 'master roadmap must include the personalized Training Lab')
expect(masterRoadmap.includes('Definition „SpeechCoach v1 bereit“'), 'master roadmap must define the v1 release condition')
expect(masterRoadmap.includes('Emotionserkennung'), 'master roadmap must retain prohibited inference boundaries')
expect(masterRoadmap.includes('personalisierte Bewerbungssimulation'), 'master roadmap must include personalized interview practice')
expect(masterRoadmap.includes('Roh-CV'), 'master roadmap must document raw-document privacy')

const accessibilityDocs = read('docs/ACCESSIBILITY.md')
expect(accessibilityDocs.includes('Nur Tastatur'), 'accessibility documentation must retain the keyboard release checklist')
expect(accessibilityDocs.includes('alle sieben Launcher'), 'accessibility documentation must cover all seven launchers')
expect(accessibilityDocs.includes('Screenreader'), 'accessibility documentation must retain real screenreader testing')
expect(accessibilityDocs.includes('Nicht behaupten ohne echten Test'), 'accessibility documentation must not overstate compliance')

const pitchDocs = read('docs/PITCH_CALIBRATION.md')
expect(pitchDocs.includes('Isolierte Oktavsprünge'), 'pitch documentation must describe isolated octave correction')
expect(pitchDocs.includes('analysisConfidence'), 'pitch documentation must describe measurement confidence')
expect(pitchDocs.includes('Manuelle Kalibrierung vor Release'), 'pitch documentation must retain real-device calibration')

const rootApp = read('src/RootApp.jsx')
expect(rootApp.includes("import AudioStudio from './AudioStudioPro.jsx'"), 'AudioStudioPro is not the active audio studio')
expect(rootApp.includes("import TeamCoach from './TeamCoach.jsx'"), 'TeamCoach is not wired into RootApp')
expect(rootApp.includes("import TrainingLab from './TrainingLab.jsx'"), 'Training Lab is not wired into RootApp')
expect(rootApp.includes('data-focus-key="lab"'), 'Training Lab launcher focus key is missing')
expect(rootApp.includes("activeView === 'lab'"), 'Training Lab overlay route is missing')
expect(rootApp.includes('MotionConfig reducedMotion="user"'), 'Framer Motion must respect the user reduced-motion preference')
expect(rootApp.includes("event.key !== 'Escape'"), 'full-screen training views must support Escape to close')
expect(rootApp.includes('data-focus-key="coach"'), 'launcher focus restoration keys are missing')
expect(rootApp.includes('aria-live="polite"'), 'view changes must be announced to assistive technology')
expect(rootApp.includes("import { abortActiveRequests } from './requestLifecycle.js'"), 'RootApp must import request cancellation')
expect(rootApp.includes('abortActiveRequests()'), 'RootApp must abort active requests when views close or change')
expect(rootApp.includes("window.addEventListener('pagehide'"), 'active requests must be cancelled when the page is hidden')
expect(rootApp.includes('button[aria-label="Zurück"]'), 'internal back navigation must cancel tracked requests')
expect(rootApp.includes("window.addEventListener('unhandledrejection'"), 'expected AbortError navigation cancellations must be handled centrally')

const trainingLab = read('src/TrainingLab.jsx')
expect(trainingLab.includes('60-Sekunden-Baseline'), 'Training Lab must retain the baseline assessment')
expect(trainingLab.includes('Lebenslauf + Stellenanzeige'), 'Training Lab must retain personalized interview preparation')
expect(trainingLab.includes('Notizen → Publikums-Q&A'), 'Training Lab must retain presentation Q&A')
expect(trainingLab.includes('5-Minuten-Drills'), 'Training Lab must retain quick drills')
expect(trainingLab.includes("from './baselineStore.js'"), 'Training Lab must use the privacy-safe baseline store')
expect(trainingLab.includes('saveBaselineProfile(profile)'), 'Training Lab must persist baseline through the safe store')
expect(trainingLab.includes('clearBaselineProfile()'), 'Training Lab must allow the active baseline to be deleted')
expect(trainingLab.includes("import PersonalizedPractice from './PersonalizedPractice.jsx'"), 'Training Lab must wire personalized practice')
expect(trainingLab.includes("modeId: 'interview'"), 'Training Lab must create personalized interview presets')
expect(trainingLab.includes("modeId: 'presentation'"), 'Training Lab must create personalized presentation presets')
expect(trainingLab.includes('Personalisierte Probe starten'), 'Training Lab must expose personalized interview practice')

const personalizedPractice = read('src/PersonalizedPractice.jsx')
expect(personalizedPractice.includes("from './coachService.js'"), 'personalized practice must reuse the guarded coach service')
expect(personalizedPractice.includes('requestCoachTurn({'), 'personalized practice must request coach scoring')
expect(personalizedPractice.includes('preset.questions'), 'personalized practice must consume only generated question presets')
expect(personalizedPractice.includes("localStorage.getItem('speech-coach-dialog-history')"), 'personalized practice must persist only normal dialog results')
expect(personalizedPractice.includes("source: 'personalized-practice'"), 'personalized practice must announce progress changes')
expect(personalizedPractice.includes('abortActiveRequests()'), 'personalized practice must cancel active requests on navigation/unmount')
expect(personalizedPractice.includes('mountedRef.current'), 'personalized practice must guard late async completion')
expect(!/preset\.(?:cv|job|notes|documents)/i.test(personalizedPractice), 'personalized practice must not receive raw document fields')

const baselineStore = read('src/baselineStore.js')
expect(baselineStore.includes("const GUEST_BASELINE_KEY = 'speech-coach-baseline'"), 'baseline store must retain guest baseline support')
expect(baselineStore.includes("const USER_BASELINE_PREFIX = 'speech-coach-user-baseline:'"), 'baseline store must scope signed-in baseline data by account')
expect(baselineStore.includes('sanitizeBaseline'), 'baseline store must sanitize persisted baseline data')
expect(baselineStore.includes('localStorage.removeItem(GUEST_BASELINE_KEY)'), 'first signed-in owner must migrate the anonymous baseline safely')
expect(!baselineStore.includes('profile.transcript'), 'baseline store must not persist the raw baseline transcript')

const contentAnalysis = read('src/contentAnalysis.js')
expect(contentAnalysis.includes('analyseContentQuality'), 'content quality analysis is missing')
expect(contentAnalysis.includes('buildInterviewQuestions'), 'interview question generator is missing')
expect(contentAnalysis.includes('buildPresentationQuestions'), 'presentation question generator is missing')
expect(contentAnalysis.includes('HEDGES'), 'content analysis must retain hedging indicators')
expect(contentAnalysis.includes('repeatedPhrases'), 'content analysis must retain repetition indicators')

const progressUtils = read('src/progressUtils.js')
expect(progressUtils.includes("import { readBaselineProfile } from './baselineStore.js'"), 'progress must use the account-scoped baseline store')
expect(progressUtils.includes('const baseline = readBaselineProfile()'), 'progress must read the active baseline profile')
expect(progressUtils.includes('measuredSkills.pace ??'), 'real measured progress must override baseline fallback')
expect(progressUtils.includes('baseline,'), 'progress output must expose baseline context')

const requestLifecycle = read('src/requestLifecycle.js')
expect(requestLifecycle.includes('new AbortController()'), 'request lifecycle must use AbortController')
expect(requestLifecycle.includes('activeControllers'), 'request lifecycle must track active controllers')
expect(requestLifecycle.includes('abortActiveRequests'), 'request lifecycle must expose bulk cancellation')

for (const service of ['src/coachService.js', 'src/teamCoachService.js', 'src/serverTranscription.js']) {
  const content = read(service)
  expect(content.includes("from './requestLifecycle.js'"), `${service} must use the shared request lifecycle`)
  expect(content.includes('createTrackedRequest('), `${service} must register cancellable requests`)
  expect(content.includes('tracked.release()'), `${service} must release request tracking after completion`)
}

const pitchAnalysis = read('src/pitchAnalysis.js')
expect(pitchAnalysis.includes('export const stabilizePitchPoints'), 'pitch analysis must expose deterministic curve stabilization')
expect(pitchAnalysis.includes('export const summarizePitchPoints'), 'pitch analysis must expose deterministic pitch summarization')
expect(pitchAnalysis.includes('correctIsolatedOctaveJumps'), 'pitch analysis must correct isolated octave tracking errors')
expect(pitchAnalysis.includes('medianWindow'), 'pitch analysis must smooth small pitch jitter before melody scoring')
expect(pitchAnalysis.includes('analysisConfidence'), 'pitch analysis must expose measurement confidence')
expect(pitchAnalysis.includes('voicedFrameRatio'), 'pitch analysis must expose voiced-frame coverage')
expect(pitchAnalysis.includes('octaveCorrectionCount'), 'pitch analysis must expose octave correction diagnostics')
expect(pitchAnalysis.includes('confidenceWeight'), 'combined audio scoring must reduce the influence of uncertain pitch data')
expect(pitchAnalysis.includes('Math.abs(difference) < 0.55'), 'melody direction changes must ignore small frame jitter')

const coreTests = read('tests/core.test.mjs')
expect(coreTests.includes('pitch stabilization removes an isolated octave error'), 'unit tests must protect octave-jump correction')
expect(coreTests.includes('expressive pitch movement scores above a near-flat jitter curve'), 'unit tests must distinguish expressive movement from jitter')
expect(coreTests.includes('pitch confidence reflects correlation quality and voiced coverage'), 'unit tests must protect pitch confidence behavior')
expect(coreTests.includes('uncertain pitch has less influence on the combined audio score'), 'unit tests must protect confidence-weighted audio scoring')

const accessibilityCss = read('src/accessibility.css')
expect(accessibilityCss.includes(':focus-visible'), 'global visible keyboard focus styling is missing')
expect(accessibilityCss.includes('@media (prefers-reduced-motion: reduce)'), 'CSS reduced-motion fallback is missing')
expect(accessibilityCss.includes('min-width: 44px'), 'coarse-pointer icon targets must retain a 44px minimum size')

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
expect(audioStudio.includes('const mountedRef = useRef(true)'), 'audio recorder must guard asynchronous completion after unmount')
expect(audioStudio.includes('const processingAbortRef = useRef(null)'), 'audio recorder must keep a processing abort controller')
expect(audioStudio.includes('const pendingAudioUrlRef = useRef(null)'), 'audio recorder must track temporary object URL ownership')
expect(audioStudio.includes('const disposeRecorder = () =>'), 'audio recorder must explicitly dispose MediaRecorder handlers')
expect(audioStudio.includes('processingAbortRef.current?.abort()'), 'audio recorder must abort precision processing on unmount')
expect(audioStudio.includes('signal: processingController.signal'), 'precision transcription must receive the recorder abort signal')
expect(audioStudio.includes('if (!mountedRef.current)'), 'audio recorder must reject late async completion after unmount')
expect(audioStudio.includes('URL.revokeObjectURL(pendingAudioUrlRef.current)'), 'audio recorder must revoke abandoned object URLs')

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

const productionChecklist = read('docs/PRODUCTION_CHECKLIST.md')
expect(productionChecklist.includes('docs/PITCH_CALIBRATION.md'), 'production checklist must require real pitch calibration')
expect(productionChecklist.includes('analysisConfidence'), 'production checklist must verify confidence-weighted pitch behavior')
expect(productionChecklist.includes('## 8. Training Lab'), 'production checklist must include Training Lab release checks')
expect(productionChecklist.includes('alle sieben Launcher'), 'production checklist must cover all seven top-level launchers')
expect(productionChecklist.includes('Personalisierte Probe starten'), 'production checklist must require personalized interview testing')
expect(productionChecklist.includes('an Coach-API gehen nur lokal erzeugte Fragen'), 'production checklist must protect personalized document privacy')

const health = read('api/health.js')
expect(health.includes("status: 'ok'"), 'health endpoint does not expose a stable ok status')
expect(health.includes("response.setHeader('Cache-Control', 'no-store, max-age=0')"), 'health endpoint must disable caching')

const deployment = JSON.parse(read('vercel.json'))
const globalHeaders = deployment.headers?.find((entry) => entry.source === '/(.*)')?.headers || []
const headerKeys = new Set(globalHeaders.map((header) => header.key))
for (const requiredHeader of [
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Strict-Transport-Security',
  'Content-Security-Policy',
  'Cross-Origin-Opener-Policy',
]) {
  expect(headerKeys.has(requiredHeader), `missing production response header: ${requiredHeader}`)
}

const sourceFiles = [
  'src/RootApp.jsx',
  'src/TrainingLab.jsx',
  'src/PersonalizedPractice.jsx',
  'src/contentAnalysis.js',
  'src/baselineStore.js',
  'src/progressUtils.js',
  'src/AudioStudioPro.jsx',
  'src/pitchAnalysis.js',
  'src/requestLifecycle.js',
  'src/cloud/cloudSync.js',
  'src/cloud/supabaseClient.js',
  'api/_security.js',
  'api/health.js',
  'api/coach.js',
  'api/team-coach.js',
  'api/transcribe.js',
  'scripts/deployment-smoke.mjs',
  'scripts/validate-production-env.mjs',
]
for (const file of sourceFiles) {
  const content = read(file)
  expect(!/VITE_OPENAI_API_KEY\s*=\s*["'][^"']+/i.test(content), `${file} appears to assign a browser OpenAI key`)
  expect(!/sk-(?:proj-)?[A-Za-z0-9_-]{20,}/.test(content), `${file} appears to contain an OpenAI secret`)
}

const syntaxFiles = [
  'api/_security.js',
  'api/health.js',
  'api/coach.js',
  'api/team-coach.js',
  'api/transcribe.js',
  'scripts/deployment-smoke.mjs',
  'scripts/validate-production-env.mjs',
  'src/audioAnalysis.js',
  'src/contentAnalysis.js',
  'src/baselineStore.js',
  'src/pitchAnalysis.js',
  'src/progressUtils.js',
  'src/requestLifecycle.js',
  'src/serverTranscription.js',
  'src/coachService.js',
  'src/teamCoachService.js',
  'src/trainingPlanEngine.js',
  'src/trainingPlanStore.js',
]

for (const file of syntaxFiles) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { encoding: 'utf8' })
  if (result.status !== 0) fail(`syntax check failed for ${file}: ${result.stderr.trim()}`)
}

if (!process.exitCode) console.log('SpeechCoach repository smoke checks passed.')