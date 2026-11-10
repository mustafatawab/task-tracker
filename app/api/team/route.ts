import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { handleApiErrors } from '@/lib/api'

const memberInput = z.object({ name: z.string().min(2).max(80), email: z.string().email(), password: z.string().min(8), role: z.string().min(2).max(60) })

export async function GET() {
  return handleApiErrors(async () => {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const members = await prisma.user.findMany({ where: { organizationId: user.organizationId }, select: { id: true, name: true, email: true, role: true, systemRole: true, active: true, createdAt: true, _count: { select: { assignedTasks: true } } }, orderBy: { createdAt: 'asc' } })
    return NextResponse.json(members)
  })
}

export async function POST(request: Request) {
  return handleApiErrors(async () => {
    const user = await getCurrentUser()
    if (!user || user.systemRole !== 'FOUNDER') return NextResponse.json({ error: 'Founder access required' }, { status: 403 })
    const parsed = memberInput.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid member details' }, { status: 400 })
    const member = await prisma.user.create({ data: { name: parsed.data.name, email: parsed.data.email.toLowerCase(), role: parsed.data.role, passwordHash: await bcrypt.hash(parsed.data.password, 12), organizationId: user.organizationId }, select: { id: true, name: true, email: true, role: true, active: true } })
    return NextResponse.json(member, { status: 201 })
  })
}
