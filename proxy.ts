import { NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE = 'farsight_session'

// Pages that are open without a session. Everything else requires one.
const AUTH_PAGES = ['/login']

// Thin outer gate ("proxy" — Next.js 16's name for what was middleware):
// cookie presence only — no DB verification here. Every API route still
// performs the full session check via getCurrentUser(). This layer exists
// purely to avoid a wasted render + loader flash for guests, and to send
// signed-in users who open an auth page back to their workspace.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(SESSION_COOKIE)
  const { pathname } = request.nextUrl
  const isAuthPage = AUTH_PAGES.includes(pathname)

  if (!hasSession && !isAuthPage) {
    const login = new URL('/login', request.url)
    // Remember where the user was heading so login can return them there.
    if (pathname !== '/') login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  // Every app page is gated by default; only auth pages, API routes
  // (which verify themselves), and static assets are excluded.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|svg|ico|css|js|woff2?)$).*)'],
}
