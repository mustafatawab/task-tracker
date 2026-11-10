import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSession } from '@/lib/session'

const credentials = z.object({ email: z.string().email(), password: z.string().min(8) })

export async function POST(request: Request) {
  const parsed = credentials.safeParse(await request.json())
  if (!parsed.success) return NextResponse.json({ error: 'Invalid credentials' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } })
  if (!user || !user.active || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  await createSession(user.id)
  return NextResponse.json({ ok: true })
}
