import { NextResponse } from 'next/server'

// CSRF defense: browsers send an Origin header on mutating requests.
// If it differs from our Host, the request is not ours — reject it before
// any session or cookie logic runs. Non-browser clients (curl, server
// scripts) may omit Origin entirely; they still need a valid session
// cookie to do anything, so they are not affected by this check.

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

export function assertSameOrigin(request: Request): NextResponse | null {
  if (!MUTATING_METHODS.has(request.method)) return null
  const origin = request.headers.get('origin')
  if (!origin) return null
  const host = request.headers.get('host')
  if (!host) return null
  try {
    if (new URL(origin).host === host) return null
  } catch {
    // malformed Origin — treat as cross-origin
  }
  return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 })
}
