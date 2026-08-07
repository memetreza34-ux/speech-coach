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
  'api/coach.js',
  'api/team-coach.js',
  'api/transcribe.js',
  'supabase/speechcoach-cloud.sql',
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

const transcribe = read('api/transcribe.js')
expect(transcribe.includes("process.env.OPENAI_API_KEY"), 'transcription endpoint must use server-side OPENAI_API_KEY')
expect(transcribe.includes("response.setHeader('Cache-Control', 'no-store')"), 'transcription endpoint must disable caching')
expect(transcribe.includes("form.append('model', 'whisper-1')"), 'timestamp transcription model changed unexpectedly')
expect(transcribe.includes("form.append('timestamp_granularities[]', 'word')"), 'word timestamps are not requested')

const sourceFiles = [
  'src/RootApp.jsx',
  'src/AudioStudioPro.jsx',
  'src/cloud/cloudSync.js',
  'src/cloud/supabaseClient.js',
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
