import { getSupabaseClient } from './cloud/supabaseClient'

const LOCAL_PLAN_PREFIX = 'speech-coach-training-plan:'

const localKey = (userId) => `${LOCAL_PLAN_PREFIX}${userId || 'guest'}`

const safeRead = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null')
    return value && typeof value === 'object' ? value : null
  } catch {
    return null
  }
}

const safeWrite = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

const normalizePlan = (plan) => {
  if (!plan || typeof plan !== 'object') return null
  return {
    ...plan,
    completedTaskIds: Array.isArray(plan.completedTaskIds) ? plan.completedTaskIds : [],
    completionTimestamps: plan.completionTimestamps && typeof plan.completionTimestamps === 'object'
      ? plan.completionTimestamps
      : {},
  }
}

const timestamp = (value) => {
  const time = new Date(value || 0).getTime()
  return Number.isFinite(time) ? time : 0
}

const mergeSamePlan = (localPlan, remotePlan) => {
  const completedTaskIds = [...new Set([
    ...(localPlan.completedTaskIds || []),
    ...(remotePlan.completedTaskIds || []),
  ])]
  const completionTimestamps = {
    ...(remotePlan.completionTimestamps || {}),
    ...(localPlan.completionTimestamps || {}),
  }
  const newer = timestamp(localPlan.updatedAt) >= timestamp(remotePlan.updatedAt) ? localPlan : remotePlan
  return {
    ...newer,
    completedTaskIds,
    completionTimestamps,
    updatedAt: new Date(Math.max(timestamp(localPlan.updatedAt), timestamp(remotePlan.updatedAt), Date.now())).toISOString(),
  }
}

const mergePlans = (localPlan, remotePlan) => {
  if (!localPlan) return remotePlan
  if (!remotePlan) return localPlan
  if (localPlan.id === remotePlan.id) return mergeSamePlan(localPlan, remotePlan)
  return timestamp(localPlan.updatedAt) >= timestamp(remotePlan.updatedAt) ? localPlan : remotePlan
}

const rowToPlan = (row) => normalizePlan({
  ...(row?.plan_payload || {}),
  completedTaskIds: Array.isArray(row?.completed_task_ids) ? row.completed_task_ids : row?.plan_payload?.completedTaskIds || [],
  updatedAt: row?.updated_at || row?.plan_payload?.updatedAt,
  startedOn: row?.started_on || row?.plan_payload?.startedOn,
})

const planToRow = (plan, userId) => ({
  user_id: userId,
  plan_payload: {
    ...plan,
    completedTaskIds: undefined,
  },
  completed_task_ids: plan.completedTaskIds || [],
  plan_version: Number(plan.version) || 1,
  started_on: plan.startedOn || new Date().toISOString().slice(0, 10),
  updated_at: plan.updatedAt || new Date().toISOString(),
})

export const readLocalTrainingPlan = (userId) => normalizePlan(safeRead(localKey(userId)))

export const writeLocalTrainingPlan = (plan, userId) => {
  const normalized = normalizePlan(plan)
  if (!normalized) return false
  const saved = safeWrite(localKey(userId), normalized)
  if (saved) window.dispatchEvent(new CustomEvent('speechcoach:plan-changed', { detail: { userId: userId || 'guest' } }))
  return saved
}

export const loadTrainingPlan = async (user) => {
  const userId = user?.id || null
  const localPlan = readLocalTrainingPlan(userId)
  if (!userId) return { plan: localPlan, source: localPlan ? 'local' : 'empty' }

  const client = await getSupabaseClient()
  if (!client) return { plan: localPlan, source: localPlan ? 'local' : 'empty' }

  const { data, error } = await client
    .from('speechcoach_training_plans')
    .select('plan_payload, completed_task_ids, plan_version, started_on, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  const remotePlan = rowToPlan(data)
  const merged = mergePlans(localPlan, remotePlan)

  if (!merged) return { plan: null, source: 'empty' }

  writeLocalTrainingPlan(merged, userId)
  const remoteDiffers = !remotePlan
    || remotePlan.id !== merged.id
    || timestamp(remotePlan.updatedAt) < timestamp(merged.updatedAt)
    || (remotePlan.completedTaskIds || []).length !== (merged.completedTaskIds || []).length

  if (remoteDiffers) {
    const { error: saveError } = await client
      .from('speechcoach_training_plans')
      .upsert(planToRow(merged, userId), { onConflict: 'user_id' })
    if (saveError) throw saveError
  }

  return {
    plan: merged,
    source: remotePlan ? 'cloud' : 'local',
  }
}

export const saveTrainingPlan = async (plan, user) => {
  const normalized = normalizePlan({
    ...plan,
    updatedAt: plan.updatedAt || new Date().toISOString(),
  })
  if (!normalized) throw new Error('Ungültiger Trainingsplan.')

  const userId = user?.id || null
  writeLocalTrainingPlan(normalized, userId)
  if (!userId) return { plan: normalized, source: 'local' }

  const client = await getSupabaseClient()
  if (!client) return { plan: normalized, source: 'local' }

  const { error } = await client
    .from('speechcoach_training_plans')
    .upsert(planToRow(normalized, userId), { onConflict: 'user_id' })
  if (error) throw error

  return { plan: normalized, source: 'cloud' }
}

export const deleteTrainingPlan = async (user) => {
  const userId = user?.id || null
  try {
    localStorage.removeItem(localKey(userId))
  } catch {
    // Local deletion is best effort.
  }
  window.dispatchEvent(new CustomEvent('speechcoach:plan-changed', { detail: { userId: userId || 'guest' } }))

  if (!userId) return
  const client = await getSupabaseClient()
  if (!client) return
  const { error } = await client
    .from('speechcoach_training_plans')
    .delete()
    .eq('user_id', userId)
  if (error) throw error
}
