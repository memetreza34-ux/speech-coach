import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PLAN_DURATION_WEEKS,
  generateTrainingPlan,
  getCurrentPlanWeek,
  getPlanStats,
  togglePlanTask,
} from '../src/trainingPlanEngine.js'
import { COACH_MODES, DIFFICULTIES } from '../src/coachScenarios.js'
import { TEAM_SCENARIOS } from '../src/teamScenarios.js'
import { groupTimestampWords } from '../src/serverTranscription.js'
import { clearApiRateLimitsForTests, guardApiRequest } from '../api/_security.js'
import healthHandler from '../api/health.js'
import coachHandler from '../api/coach.js'
import teamCoachHandler from '../api/team-coach.js'
import transcribeHandler from '../api/transcribe.js'

const createMockResponse = () => {
  const state = { statusCode: 200, headers: {}, body: null, ended: false }
  return {
    state,
    setHeader(key, value) {
      state.headers[key] = value
    },
    status(code) {
      state.statusCode = code
      return this
    },
    json(body) {
      state.body = body
      state.ended = true
      return body
    },
    end() {
      state.ended = true
    },
  }
}

test('training plan always spans four weeks and clamps weekly sessions', () => {
  const lowGoal = generateTrainingPlan({ weeklyGoal: 1, previousPlanId: 'test-low' })
  const highGoal = generateTrainingPlan({ weeklyGoal: 20, previousPlanId: 'test-high' })

  assert.equal(lowGoal.durationWeeks, PLAN_DURATION_WEEKS)
  assert.equal(lowGoal.weeks.length, 4)
  assert.equal(lowGoal.sessionsPerWeek, 3)
  assert.ok(lowGoal.weeks.every((week) => week.tasks.length === 3))

  assert.equal(highGoal.sessionsPerWeek, 7)
  assert.ok(highGoal.weeks.every((week) => week.tasks.length === 7))
})

test('training plan prioritizes the weakest measured skills', () => {
  const progress = {
    overall: 71,
    sessions: [{ id: 'one' }],
    skills: {
      pace: 85,
      fillerControl: 42,
      clarity: 61,
      structure: 55,
      impact: 79,
      voiceDynamics: 48,
      pauseControl: 73,
    },
  }
  const plan = generateTrainingPlan({ progress, weeklyGoal: 5, previousPlanId: 'focus-test' })

  assert.deepEqual(
    plan.focusSkills.map((skill) => skill.key),
    ['fillerControl', 'voiceDynamics', 'structure'],
  )
})

test('plan completion toggles safely and stats stay consistent', () => {
  const plan = generateTrainingPlan({ weeklyGoal: 3, previousPlanId: 'toggle-test' })
  const firstTask = plan.weeks[0].tasks[0]
  const completed = togglePlanTask(plan, firstTask.id)
  const completedStats = getPlanStats(completed)

  assert.equal(completed.completedTaskIds.includes(firstTask.id), true)
  assert.equal(completedStats.completedCount, 1)
  assert.equal(completedStats.totalCount, 12)

  const reopened = togglePlanTask(completed, firstTask.id)
  assert.equal(reopened.completedTaskIds.includes(firstTask.id), false)
  assert.equal(getPlanStats(reopened).completedCount, 0)
})

test('current plan week is bounded to the four-week program', () => {
  const plan = { startedOn: '2026-08-01' }
  assert.equal(getCurrentPlanWeek(plan, new Date('2026-08-01T12:00:00')), 1)
  assert.equal(getCurrentPlanWeek(plan, new Date('2026-08-15T12:00:00')), 3)
  assert.equal(getCurrentPlanWeek(plan, new Date('2026-12-01T12:00:00')), 4)
})

test('coach scenario catalogs keep their production invariants', () => {
  assert.equal(COACH_MODES.length, 6)
  assert.equal(DIFFICULTIES.length, 3)
  assert.ok(COACH_MODES.every((mode) => mode.topics.length >= 6 && mode.followUps.length >= 4))

  assert.equal(TEAM_SCENARIOS.length, 6)
  assert.ok(TEAM_SCENARIOS.every((scenario) => scenario.roles.length === 3))
  assert.ok(TEAM_SCENARIOS.every((scenario) => new Set(scenario.roles.map((role) => role.id)).size === 3))
})

test('word timestamps are grouped into clickable transcript chunks', () => {
  const words = [
    { word: 'Das', start: 0.1, end: 0.3 },
    { word: 'ist', start: 0.31, end: 0.5 },
    { word: 'ein', start: 0.51, end: 0.65 },
    { word: 'Test.', start: 0.66, end: 0.9 },
    { word: 'Noch', start: 1.1, end: 1.3 },
    { word: 'ein', start: 1.31, end: 1.45 },
    { word: 'Satz.', start: 1.46, end: 1.8 },
    { word: 'Weiter.', start: 2, end: 2.3 },
  ]

  const groups = groupTimestampWords(words, 7)
  assert.equal(groups.length, 2)
  assert.equal(groups[0].start, 0.1)
  assert.equal(groups[0].end, 1.8)
  assert.equal(groups[1].text, 'Weiter.')
})

test('health endpoint exposes readiness without secrets', () => {
  const response = createMockResponse()
  healthHandler({ method: 'GET' }, response)

  assert.equal(response.state.statusCode, 200)
  assert.equal(response.state.body.status, 'ok')
  assert.equal(response.state.body.service, 'speechcoach')
  assert.equal(typeof response.state.body.capabilities.aiCoachConfigured, 'boolean')
  assert.equal(JSON.stringify(response.state.body).includes('OPENAI_API_KEY'), false)
  assert.equal(response.state.headers['Cache-Control'], 'no-store, max-age=0')
})

test('serverless endpoints reject unsupported methods', async () => {
  for (const handler of [coachHandler, teamCoachHandler, transcribeHandler]) {
    const response = createMockResponse()
    await handler({ method: 'GET', headers: {} }, response)
    assert.equal(response.state.statusCode, 405)
    assert.match(String(response.state.headers.Allow), /POST/)
    assert.equal(typeof response.state.headers['X-Request-Id'], 'string')
  }
})

test('AI endpoints fail closed when the server key is missing', async () => {
  const previousKey = process.env.OPENAI_API_KEY
  delete process.env.OPENAI_API_KEY
  clearApiRateLimitsForTests()

  try {
    for (const [index, handler] of [coachHandler, teamCoachHandler, transcribeHandler].entries()) {
      const response = createMockResponse()
      await handler({
        method: 'POST',
        body: {},
        headers: { 'x-forwarded-for': `198.51.100.${index + 1}` },
      }, response)
      assert.equal(response.state.statusCode, 503)
      assert.equal(response.state.ended, true)
      assert.equal(typeof response.state.body.requestId, 'string')
    }
  } finally {
    if (previousKey === undefined) delete process.env.OPENAI_API_KEY
    else process.env.OPENAI_API_KEY = previousKey
  }
})

test('API guard rejects foreign origins, oversized bodies and wrong content types', () => {
  clearApiRateLimitsForTests()

  const foreignResponse = createMockResponse()
  const foreign = guardApiRequest({
    method: 'POST',
    body: {},
    headers: {
      origin: 'https://attacker.example',
      host: 'speechcoach.example',
      'x-forwarded-proto': 'https',
      'x-forwarded-for': '203.0.113.10',
      'content-type': 'application/json',
    },
  }, foreignResponse, { scope: 'origin-test' })
  assert.equal(foreign.ok, false)
  assert.equal(foreignResponse.state.statusCode, 403)

  const largeResponse = createMockResponse()
  const large = guardApiRequest({
    method: 'POST',
    body: {},
    headers: {
      'content-length': '4096',
      'x-forwarded-for': '203.0.113.11',
      'content-type': 'application/json',
    },
  }, largeResponse, { scope: 'body-test', maxBodyBytes: 128 })
  assert.equal(large.ok, false)
  assert.equal(largeResponse.state.statusCode, 413)

  const typeResponse = createMockResponse()
  const wrongType = guardApiRequest({
    method: 'POST',
    body: 'hello',
    headers: {
      'content-type': 'text/plain',
      'x-forwarded-for': '203.0.113.12',
    },
  }, typeResponse, { scope: 'type-test' })
  assert.equal(wrongType.ok, false)
  assert.equal(typeResponse.state.statusCode, 415)
})

test('API guard accepts same-origin traffic and rate-limits repeated requests', () => {
  clearApiRateLimitsForTests()
  const request = {
    method: 'POST',
    body: {},
    headers: {
      origin: 'https://speechcoach.example',
      host: 'speechcoach.example',
      'x-forwarded-proto': 'https',
      'x-forwarded-for': '203.0.113.40',
      'content-type': 'application/json',
    },
  }

  for (let index = 0; index < 2; index += 1) {
    const response = createMockResponse()
    const result = guardApiRequest(request, response, { scope: 'rate-test', rateLimit: 2, rateWindowMs: 60_000 })
    assert.equal(result.ok, true)
    assert.equal(response.state.headers['X-RateLimit-Limit'], '2')
  }

  const blockedResponse = createMockResponse()
  const blocked = guardApiRequest(request, blockedResponse, { scope: 'rate-test', rateLimit: 2, rateWindowMs: 60_000 })
  assert.equal(blocked.ok, false)
  assert.equal(blockedResponse.state.statusCode, 429)
  assert.equal(typeof blockedResponse.state.headers['Retry-After'], 'string')
})
