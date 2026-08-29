const activeControllers = new Set()

const createAbortReason = () => {
  try {
    return new DOMException('Request lifecycle ended.', 'AbortError')
  } catch {
    const error = new Error('Request lifecycle ended.')
    error.name = 'AbortError'
    return error
  }
}

export const createTrackedRequest = (externalSignal) => {
  const controller = new AbortController()
  let released = false

  const abortFromExternal = () => {
    if (!controller.signal.aborted) controller.abort(externalSignal?.reason || createAbortReason())
  }

  if (externalSignal?.aborted) abortFromExternal()
  else externalSignal?.addEventListener?.('abort', abortFromExternal, { once: true })

  activeControllers.add(controller)

  const release = () => {
    if (released) return
    released = true
    activeControllers.delete(controller)
    externalSignal?.removeEventListener?.('abort', abortFromExternal)
  }

  return { signal: controller.signal, release }
}

export const abortActiveRequests = () => {
  const reason = createAbortReason()
  for (const controller of activeControllers) {
    if (!controller.signal.aborted) controller.abort(reason)
  }
  activeControllers.clear()
}

export const activeRequestCountForTests = () => activeControllers.size
