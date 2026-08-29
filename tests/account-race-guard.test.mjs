import test from 'node:test'
import assert from 'node:assert/strict'

import {
  assertActiveLocalOwner,
  createStaleAccountError,
  isActiveLocalOwner,
  readActiveLocalOwner,
} from '../src/cloud/accountRaceGuard.js'

const createStorage = (owner = null) => {
  const values = new Map()
  if (owner) values.set('speech-coach-active-local-owner', owner)
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null },
    setItem(key, value) { values.set(key, String(value)) },
    removeItem(key) { values.delete(key) },
  }
}

test('account owner guard identifies the active local account', () => {
  const storage = createStorage('user-a')
  assert.equal(readActiveLocalOwner(storage), 'user-a')
  assert.equal(isActiveLocalOwner('user-a', storage), true)
  assert.equal(isActiveLocalOwner('user-b', storage), false)
  assert.equal(assertActiveLocalOwner('user-a', storage), true)
})

test('stale account operations fail as AbortError', () => {
  const storage = createStorage('user-b')
  assert.throws(
    () => assertActiveLocalOwner('user-a', storage),
    (error) => error?.name === 'AbortError' && error?.code === 'STALE_ACCOUNT_CONTEXT',
  )

  const error = createStaleAccountError('user-a')
  assert.equal(error.name, 'AbortError')
  assert.equal(error.code, 'STALE_ACCOUNT_CONTEXT')
  assert.equal(error.userId, 'user-a')
})

test('blocked or missing storage fails closed', () => {
  const blocked = {
    getItem() { throw new Error('blocked') },
  }
  assert.equal(readActiveLocalOwner(blocked), null)
  assert.equal(isActiveLocalOwner('user-a', blocked), false)
  assert.throws(() => assertActiveLocalOwner('user-a', blocked), { name: 'AbortError' })
})
