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
]

test('A-to-Z documentation set remains complete', () => {
  for (const path of requiredDocs) assert.equal(fs.existsSync(path), true, `${path} is missing`)

  const master = read('docs/MASTER_ROADMAP.md')
  assert.match(master, /Feature-Freeze/)
  assert.match(master, /Legal-\/Datenschutz/)
  assert.match(master, /Kostenkontrolle/)
  assert.match(master, /Browser- und Geräte-Matrix/)
  assert.match(master, /Emotionserkennung/)

  const legal = read('docs/LEGAL_DATA_RELEASE.md')
  assert.match(legal, /CV-\/Stellenanzeigentexte/)
  assert.match(legal, /keine Eignungsprognose/)

  const operations = read('docs/OPERATIONS_RELEASE.md')
  assert.match(operations, /Training-Lab-E2E/)
  assert.match(operations, /CSP\/Supply Chain/)
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
  assert.match(baselineStore, /speech-coach-user-baseline:/)
  assert.match(lab, /Lebenslauf \+ Stellenanzeige/)
  assert.match(lab, /Präsentationsnotizen/)
  assert.match(lab, /60-Sekunden-Baseline/)
})