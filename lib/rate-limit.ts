const MAX_ATTEMPTS = 5
const LOCK_DURATION_MS = 5 * 60 * 1000

type Entry = { count: number; lockedUntil: number | null }

const attempts = new Map<string, Entry>()

function keyFor(email: string) {
  return email.toLowerCase()
}

function entryFor(email: string) {
  const key = keyFor(email)
  let entry = attempts.get(key)
  if (!entry) {
    entry = { count: 0, lockedUntil: null }
    attempts.set(key, entry)
  }
  return entry
}

export function checkLocked(email: string): { locked: boolean; retryAfterMs: number } {
  const entry = entryFor(email)
  if (!entry.lockedUntil) return { locked: false, retryAfterMs: 0 }
  const remaining = entry.lockedUntil - Date.now()
  if (remaining <= 0) {
    entry.count = 0
    entry.lockedUntil = null
    return { locked: false, retryAfterMs: 0 }
  }
  return { locked: true, retryAfterMs: remaining }
}

export function recordFailure(email: string): { locked: boolean; retryAfterMs: number } {
  const entry = entryFor(email)
  entry.count += 1
  if (entry.count >= MAX_ATTEMPTS && !entry.lockedUntil) {
    entry.lockedUntil = Date.now() + LOCK_DURATION_MS
  }
  if (entry.lockedUntil) {
    const remaining = entry.lockedUntil - Date.now()
    if (remaining > 0) return { locked: true, retryAfterMs: remaining }
    entry.count = 0
    entry.lockedUntil = null
  }
  return { locked: false, retryAfterMs: 0 }
}

export function remainingAttempts(email: string) {
  const entry = entryFor(email)
  return Math.max(0, MAX_ATTEMPTS - entry.count)
}

export function clearAttempts(email: string) {
  attempts.delete(keyFor(email))
}

export function minutesLeft(retryAfterMs: number) {
  return Math.max(1, Math.ceil(retryAfterMs / 60000))
}
