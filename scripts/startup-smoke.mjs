import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const expect = (condition, message) => {
  if (!condition) {
    console.error(`STARTUP SMOKE FAILED: ${message}`)
    process.exitCode = 1
  }
}

const bootstrapPath = path.join(root, 'src/localDataBootstrap.js')
const legacyAudioPath = path.join(root, 'src/AudioStudio.jsx')
const mainPath = path.join(root, 'src/main.jsx')
const bootstrapTestPath = path.join(root, 'tests/local-data-bootstrap.test.mjs')

expect(fs.existsSync(bootstrapPath), 'src/localDataBootstrap.js is missing')
expect(fs.existsSync(mainPath), 'src/main.jsx is missing')
expect(fs.existsSync(bootstrapTestPath), 'local data bootstrap regression tests are missing')
expect(!fs.existsSync(legacyAudioPath), 'legacy src/AudioStudio.jsx must stay removed; AudioStudioPro is the only active implementation')

if (fs.existsSync(bootstrapPath) && fs.existsSync(mainPath)) {
  const bootstrap = read('src/localDataBootstrap.js')
  const main = read('src/main.jsx')

  expect(main.includes("import { normalizeLocalHistoryStores } from './localDataBootstrap.js'"), 'main.jsx must import local history normalization')
  expect(main.includes('normalizeLocalHistoryStores()'), 'main.jsx must normalize local history before rendering')
  expect(main.indexOf('normalizeLocalHistoryStores()') < main.indexOf('createRoot('), 'history normalization must run before React createRoot')

  for (const key of [
    'speech-coach-history',
    'speech-coach-dialog-history',
    'speech-coach-audio-history',
  ]) {
    expect(bootstrap.includes(key), `bootstrap must guard ${key}`)
  }

  expect(bootstrap.includes('Array.isArray(parsed)'), 'bootstrap must preserve only array-shaped histories')
  expect(bootstrap.includes("storage.setItem(key, '[]')"), 'bootstrap must repair invalid histories to an empty array')

  const syntax = spawnSync(process.execPath, ['--check', bootstrapPath], { encoding: 'utf8' })
  expect(syntax.status === 0, `localDataBootstrap syntax check failed: ${syntax.stderr.trim()}`)
}

if (!process.exitCode) console.log('SpeechCoach startup/cleanup smoke checks passed.')
