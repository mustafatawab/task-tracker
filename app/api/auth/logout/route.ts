import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/session'
import { assertSameOrigin } from '@/lib/csrf'

export async function POST(request: Request) {
  const csrf = assertSameOrigin(request)
  if (csrf) return csrf
  await destroySession()
  return NextResponse.json({ ok: true })
}

// GET logout (sidebar link). Browsers label every navigation with a
// Sec-Fetch-Site header — a cross-site link alone must never be able to
// end a session, so only same-origin navigations destroy the session.
export async function GET(request: NextRequest) {
  const site = request.headers.get('sec-fetch-site')
  if (site !== 'same-origin' && site !== 'none') {
    return NextResponse.redirect(new URL('/', request.url))
  }
  await destroySession()
  return NextResponse.redirect(new URL('/login', request.url))
}
