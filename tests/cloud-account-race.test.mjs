import test from 'node:test'
import assert from 'node:assert/strict'

import { loadOrCreateProfile, syncTrainingData } from '../src/cloud/cloudSync.js'

const createStorage = (initial = {}) => {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, String(value)) },
    removeItem(key) { values.delete(key) },
  }
}

const installBrowserMocks = (storage) => {
  const previousStorage = global.localStorage
  const previousWindow = global.window
  const previousCustomEvent = global.CustomEvent
  global.localStorage = storage
  global.CustomEvent = class CustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail }
  }
  global.window = { dispatchEvent() {} }
  return () => {
    if (previousStorage === undefined) delete global.localStorage
    else global.localStorage = previousStorage
    if (previousWindow === undefined) delete global.window
    else global.window = previousWindow
    if (previousCustomEvent === undefined) delete global.CustomEvent
    else global.CustomEvent = previousCustomEvent
  }
}

test('stale cloud download cannot overwrite a newly active account', async () => {
  const storage = createStorage({
    'speech-coach-active-local-owner': 'user-a',
    'speech-coach-history': '[]',
    'speech-coach-dialog-history': '[]',
    'speech-coach-audio-history': '[]',
  })
  const restore = installBrowserMocks(storage)

  let resolveDownload
  const downloadPromise = new Promise((resolve) => { resolveDownload = resolve })
  const client = {
    from(table) {
      assert.equal(table, 'speechcoach_sessions')
      return {
        select() {
          return {
            eq() {
              return {
                order() {
                  return { limit() { return downloadPromise } }
                },
              }
            },
          }
        },
      }
    },
  }

  try {
    const syncPromise = syncTrainingData(client, { id: 'user-a' }, { syncEnabled: true, storeTranscripts: false })

    storage.setItem('speech-coach-active-local-owner', 'user-b')
    storage.setItem('speech-coach-history', JSON.stringify([{ id: 'b-local', createdAt: '2026-08-29T10:00:00.000Z' }]))
    storage.setItem('speech-coach-sync-state', JSON.stringify({ status: 'b-idle' }))

    resolveDownload({
      data: [{
        client_id: 'a-cloud',
        session_type: 'solo',
        payload: { id: 'a-cloud', createdAt: '2026-08-28T10:00:00.000Z' },
        started_at: '2026-08-28T10:00:00.000Z',
      }],
      error: null,
    })

    await assert.rejects(syncPromise, (error) => error?.name === 'AbortError' && error?.code === 'STALE_ACCOUNT_CONTEXT')
    assert.deepEqual(JSON.parse(storage.getItem('speech-coach-history')), [{ id: 'b-local', createdAt: '2026-08-29T10:00:00.000Z' }])
    assert.deepEqual(JSON.parse(storage.getItem('speech-coach-sync-state')), { status: 'b-idle' })
  } finally {
    restore()
  }
})

test('stale profile hydration cannot overwrite the new account profile cache', async () => {
  const storage = createStorage({
    'speech-coach-active-local-owner': 'user-a',
  })
  const restore = installBrowserMocks(storage)

  let resolveProfile
  const profilePromise = new Promise((resolve) => { resolveProfile = resolve })
  const client = {
    from(table) {
      assert.equal(table, 'speechcoach_profiles')
      return {
        select() {
          return {
            eq() { return { maybeSingle() { return profilePromise } } },
          }
        },
      }
    },
  }

  try {
    const hydration = loadOrCreateProfile(client, { id: 'user-a', email: 'a@example.com', user_metadata: {} })

    storage.setItem('speech-coach-active-local-owner', 'user-b')
    storage.setItem('speech-coach-account-profile', JSON.stringify({ userId: 'user-b', displayName: 'B' }))

    resolveProfile({
      data: {
        user_id: 'user-a',
        display_name: 'A',
        weekly_goal: 5,
        sync_enabled: true,
        store_transcripts: false,
        updated_at: '2026-08-29T10:00:00.000Z',
      },
      error: null,
    })

    const profile = await hydration
    assert.equal(profile.userId, 'user-a')
    assert.deepEqual(JSON.parse(storage.getItem('speech-coach-account-profile')), { userId: 'user-b', displayName: 'B' })
  } finally {
    restore()
  }
})
