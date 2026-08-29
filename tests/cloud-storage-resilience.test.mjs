import test from 'node:test'
import assert from 'node:assert/strict'

import {
  activateLocalUser,
  deactivateLocalUser,
  readLocalProfile,
  readSyncState,
} from '../src/cloud/cloudSync.js'

const installBrowserMocks = () => {
  const previousStorage = global.localStorage
  const previousWindow = global.window
  const previousCustomEvent = global.CustomEvent

  global.localStorage = {
    getItem() { throw new DOMException('blocked', 'SecurityError') },
    setItem() { throw new DOMException('blocked', 'SecurityError') },
    removeItem() { throw new DOMException('blocked', 'SecurityError') },
  }
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

test('account activation and deactivation do not crash when localStorage is blocked', () => {
  const restore = installBrowserMocks()
  try {
    assert.doesNotThrow(() => activateLocalUser('user-a'))
    assert.equal(readLocalProfile(), null)
    assert.equal(readSyncState(), null)
    assert.doesNotThrow(() => deactivateLocalUser('user-a'))
  } finally {
    restore()
  }
})
