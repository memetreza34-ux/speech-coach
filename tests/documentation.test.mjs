import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')

const requiredDocs = [
  'docs/INDEX.md',
  'docs/MASTER_ROADMAP.md',
  'docs/PRODUCT_SPEC.md',
  'docs/AI_EVALUATION.md',
  'docs/LEGAL_DATA_RELEASE.md',
  'docs/OPERATIONS_RELEASE.md',
  'docs/PRODUCTION_CHECKLIST.md',
  'docs/DEPLOYMENT.md',
  'docs/ACCESSIBILITY.md',
  'docs/API_SECURITY.md',
  'docs/PITCH_CALIBRATION.md',
  'docs/ACCOUNT_RACE_HARDENING.md',
]

test('A-to-Z documentation set remains complete', () => {
  for (const path of requiredDocs) assert.equal(fs.existsSync(path), true, `${path} is missing`)

  const index = read('docs/INDEX.md')
  assert.match(index, /ACCOUNT_RACE_HARDENING\.md/)
  assert.match(index, /Account-Race-Matrix/)

  const master = read('docs/MASTER_ROADMAP.md')
  assert.match(master, /Feature-Freeze/)
  assert.match(master, /Legal-\/Datenschutz/)
  assert.match(master, /Kostenkontrolle/)
  assert.match(master, /Browser- und Geräte-Matrix/)
  assert.match(master, /Emotionserkennung/)
  assert.match(master, /personalisierte Bewerbungssimulation/)
  assert.match(master, /Roh-CV/)

  const legal = read('docs/LEGAL_DATA_RELEASE.md')
  assert.match(legal, /CV-\/Stellenanzeigentexte/)
  assert.match(legal, /keine Eignungsprognose/)

  const operations = read('docs/OPERATIONS_RELEASE.md')
  assert.match(operations, /Training-Lab-E2E/)
  assert.match(operations, /CSP\/Supply Chain/)

  const accountRace = read('docs/ACCOUNT_RACE_HARDENING.md')
  assert.match(accountRace, /STALE_ACCOUNT_CONTEXT/)
  assert.match(accountRace, /Wechsel während Sync/)
  assert.match(accountRace, /Wechsel während Export/)
  assert.match(accountRace, /Wechsel während Account-Löschung/)
})

test('Training Lab remains wired into RootApp and progress fallback', () => {
  const root = read('src/RootApp.jsx')
  const progress = read('src/progressUtils.js')
  const lab = read('src/TrainingLab.jsx')
  const baselineStore = read('src/baselineStore.js')

  assert.match(root, /import TrainingLab from '\.\/TrainingLab\.jsx'/)
  assert.match(root, /data-focus-key="lab"/)
  assert.match(root, /activeView === 'lab'/)
  assert.match(progress, /readBaselineProfile/)
  assert.match(progress, /measuredSkills\.clarity \?\?/)
  assert.match(lab, /from '\.\/baselineStore\.js'/)
  assert.match(lab, /saveBaselineProfile/)
  assert.match(lab, /BASELINE_MIN_WORDS = 20/)
  assert.match(lab, /BASELINE_MIN_DURATION_MS = 12_000/)
  assert.match(baselineStore, /speech-coach-user-baseline:/)
  assert.match(baselineStore, /ALLOWED_SKILLS/)
  assert.match(lab, /Lebenslauf \+ Stellenanzeige/)
  assert.match(lab, /Präsentationsnotizen/)
  assert.match(lab, /60-Sekunden-Baseline/)
})

test('personalized practice uses generated questions without forwarding raw documents', () => {
  assert.equal(fs.existsSync('src/PersonalizedPractice.jsx'), true)
  assert.equal(fs.existsSync('src/personalized-practice.css'), true)

  const lab = read('src/TrainingLab.jsx')
  const practice = read('src/PersonalizedPractice.jsx')

  assert.match(lab, /import PersonalizedPractice from '\.\/PersonalizedPractice\.jsx'/)
  assert.match(lab, /modeId: 'interview'/)
  assert.match(lab, /modeId: 'presentation'/)
  assert.match(lab, /Personalisierte Probe starten/)
  assert.match(practice, /requestCoachTurn/)
  assert.match(practice, /speech-coach-dialog-history/)
  assert.match(practice, /abortActiveRequests/)
  assert.match(practice, /preset\.questions/)
  assert.match(practice, /slice\(0, 6\)/)
  assert.doesNotMatch(practice, /preset\.(?:cv|job|notes|documents)/i)
  assert.doesNotMatch(practice, /requestCoachTurn\([^)]*(?:cv|job|notes)/is)
})

test('release cleanup keeps only AudioStudioPro and normalizes history before React startup', () => {
  assert.equal(fs.existsSync('src/AudioStudio.jsx'), false)
  assert.equal(fs.existsSync('src/AudioStudioPro.jsx'), true)
  assert.equal(fs.existsSync('src/localDataBootstrap.js'), true)

  const root = read('src/RootApp.jsx')
  const main = read('src/main.jsx')
  const bootstrap = read('src/localDataBootstrap.js')

  assert.match(root, /import AudioStudio from '\.\/AudioStudioPro\.jsx'/)
  assert.match(main, /normalizeLocalHistoryStores\(\)/)
  assert.match(bootstrap, /speech-coach-history/)
  assert.match(bootstrap, /speech-coach-dialog-history/)
  assert.match(bootstrap, /speech-coach-audio-history/)
  assert.match(bootstrap, /Array\.isArray\(parsed\)/)
})

test('account race protection remains part of code and regression suite', () => {
  for (const path of [
    'src/cloud/accountRaceGuard.js',
    'tests/account-race-guard.test.mjs',
    'tests/cloud-account-race.test.mjs',
    'tests/auth-context-race.test.mjs',
  ]) assert.equal(fs.existsSync(path), true, `${path} is missing`)

  const auth = read('src/cloud/AuthContext.jsx')
  const cloud = read('src/cloud/cloudSync.js')
  assert.match(auth, /hydrateGenerationRef/)
  assert.match(auth, /visibleProfile/)
  assert.match(auth, /createStaleAccountError/)
  assert.match(cloud, /assertActiveLocalOwner/)
  assert.match(cloud, /isActiveLocalOwner/)
})
