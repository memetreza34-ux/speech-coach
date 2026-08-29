import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const auth = fs.readFileSync('src/cloud/AuthContext.jsx', 'utf8')
const cloudSync = fs.readFileSync('src/cloud/cloudSync.js', 'utf8')

test('auth hydration and sync are scoped to the current account', () => {
  assert.match(auth, /const hydrateGenerationRef = useRef\(0\)/)
  assert.match(auth, /const generation = \+\+hydrateGenerationRef\.current/)
  assert.match(auth, /generation !== hydrateGenerationRef\.current/)
  assert.match(auth, /syncPromiseRef\.current = \{ userId: syncUserId, promise: task \}/)
  assert.match(auth, /syncPromiseRef\.current\?\.promise === task/)
  assert.match(auth, /error\?\.name === 'AbortError'/)
  assert.match(auth, /syncProfile\.userId && syncProfile\.userId !== syncUserId/)
  assert.match(auth, /const visibleProfile = user && profile\?\.userId === user\.id \? profile : null/)
  assert.match(auth, /profile: visibleProfile/)
})

test('local destructive actions re-check account ownership after awaits', () => {
  const removeLocalStart = auth.indexOf('const removeLocalTraining = async')
  const deleteAccountStart = auth.indexOf('const deleteAccount = async')
  const removeLocalBlock = auth.slice(removeLocalStart, deleteAccountStart)

  const guardIndex = removeLocalBlock.indexOf('activeUserIdRef.current !== currentUser.id')
  const clearIndex = removeLocalBlock.indexOf('clearLocalTrainingData(currentUser.id)')
  assert.ok(guardIndex >= 0, 'removeLocalTraining must re-check the active account')
  assert.ok(clearIndex > guardIndex, 'local data must only be cleared after the active-account guard')

  const deleteBlock = auth.slice(deleteAccountStart)
  const inactiveGuard = deleteBlock.indexOf('activeUserIdRef.current !== currentUserId')
  const inactiveCleanup = deleteBlock.indexOf('removeStoredAccountArtifacts(currentUserId)')
  const activePurge = deleteBlock.indexOf('purgeLocalAccountData(currentUserId)')
  assert.ok(inactiveGuard >= 0 && inactiveCleanup > inactiveGuard, 'inactive deleted accounts need scoped cleanup')
  assert.ok(activePurge > inactiveCleanup, 'global local purge must only occur for the still-active deleted account')
})

test('account exports snapshot local data before cloud awaits', () => {
  const exportStart = auth.indexOf('const exportAccountData = async')
  const deleteCloudStart = auth.indexOf('const deleteCloudTrainingData = async')
  const block = auth.slice(exportStart, deleteCloudStart)
  const localSnapshot = block.indexOf('const localTrainingSnapshot')
  const planSnapshot = block.indexOf('const localPlanSnapshot')
  const remoteAwait = block.indexOf('await Promise.all')
  assert.ok(localSnapshot >= 0 && localSnapshot < remoteAwait)
  assert.ok(planSnapshot >= 0 && planSnapshot < remoteAwait)
})

test('cloud writes are guarded against account switches', () => {
  assert.match(cloudSync, /assertActiveLocalOwner\(user\.id\)/)
  assert.match(cloudSync, /if \(isActiveLocalOwner\(user\.id\)\) saveLocalProfile\(profile\)/)
  assert.match(cloudSync, /if \(isActiveLocalOwner\(user\.id\)\) saveLocalProfile\(normalized\)/)

  const downloadGuard = cloudSync.lastIndexOf('assertActiveLocalOwner(user.id)')
  const localWrite = cloudSync.indexOf('safeWrite(key, mergeSessions', downloadGuard)
  assert.ok(downloadGuard >= 0 && localWrite > downloadGuard, 'cloud download must re-check the owner before local merge writes')
})
