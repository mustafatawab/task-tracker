import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'
import { assertSameOrigin } from '@/lib/csrf'
import { checkLocked, clearAttempts, minutesLeft, recordFailure, remainingAttempts } from '@/lib/rate-limit'

const credentials = z.object({ email: z.string().email(), password: z.string().min(8) })

export async function POST(request: Request) {
  const csrf = assertSameOrigin(request)
  if (csrf) return csrf
  const parsed = credentials.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })

  const lock = checkLocked(parsed.data.email)
  if (lock.locked) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${minutesLeft(lock.retryAfterMs)} minute${minutesLeft(lock.retryAfterMs) === 1 ? '' : 's'}.` },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(lock.retryAfterMs / 1000)) } },
    )
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } })
  const passwordOk = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false

  // Correct email + password but deactivated: tell the user plainly.
  // This must come after the bcrypt compare so we only reveal deactivation
  // to someone who genuinely owns the credentials.
  if (user && passwordOk && !user.active) {
    return NextResponse.json({ error: 'Your account has been deactivated. Please notify your organization admin to reactivate it.' }, { status: 403 })
  }

  if (!user || !passwordOk) {
    const failure = recordFailure(parsed.data.email)
    if (failure.locked) {
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${minutesLeft(failure.retryAfterMs)} minute${minutesLeft(failure.retryAfterMs) === 1 ? '' : 's'}.` },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(failure.retryAfterMs / 1000)) } },
      )
    }
    const remaining = remainingAttempts(parsed.data.email)
    return NextResponse.json({ error: remaining <= 2 ? `Invalid credentials. ${remaining} attempt${remaining === 1 ? '' : 's'} left before a 5-minute lock.` : 'Invalid credentials' }, { status: 401 })
  }

  clearAttempts(parsed.data.email)
  await createSession(user.id)
  return NextResponse.json({ ok: true })
}
