import { NextResponse } from 'next/server'

// Wraps a route handler so database/infra failures always return valid JSON
// instead of Next.js's non-JSON 500 shell (which breaks res.json() on the client).
export async function handleApiErrors(handler: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await handler()
  } catch (error) {
    console.error('[api]', error)
    return NextResponse.json({ error: 'The task tracker service is unreachable right now. Try again shortly.' }, { status: 503 })
  }
}
