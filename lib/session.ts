import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const COOKIE_NAME = 'farsight_session'

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value
  if (!token) return null
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } })
  if (!session || session.expiresAt < new Date() || !session.user.active) return null
  return session.user
}

export async function createSession(userId: string) {
  const token = crypto.randomUUID() + crypto.randomUUID()
  await prisma.session.create({ data: { token, userId, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14) } })
  const store = await cookies()
  store.set(COOKIE_NAME, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 14 })
}

export async function destroySession() {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (token) await prisma.session.deleteMany({ where: { token } })
  store.delete(COOKIE_NAME)
}
