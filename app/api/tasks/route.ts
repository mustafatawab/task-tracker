import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { handleApiErrors } from '@/lib/api'
import { assertSameOrigin } from '@/lib/csrf'

const taskInput = z.object({ title: z.string().min(1).max(120), description: z.string().max(1000).default(''), assigneeId: z.string().min(1), priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'), dueDate: z.string().optional() })

export async function GET(request: Request) {
  return handleApiErrors(async () => {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const isFounder = user.systemRole === 'FOUNDER'

    // Deleted tasks: founder-only view, explicitly requested via ?deleted=1.
    // Soft-deleted tasks are never restorable — this listing is for audit only.
    const showDeleted = new URL(request.url).searchParams.get('deleted') === '1'
    if (showDeleted && !isFounder) return NextResponse.json({ error: 'Founder access required' }, { status: 403 })
    const deletedFilter = showDeleted ? { deletedAt: { not: null } } : { deletedAt: null }

    const scope = isFounder ? { organizationId: user.organizationId } : { assigneeId: user.id }
    const tasks = await prisma.task.findMany({ where: { ...scope, ...deletedFilter }, include: { assignee: { select: { id: true, name: true, role: true } } }, orderBy: { updatedAt: 'desc' } })
    return NextResponse.json(tasks)
  })
}

export async function POST(request: Request) {
  return handleApiErrors(async () => {
    const csrf = assertSameOrigin(request)
    if (csrf) return csrf
    const user = await getCurrentUser()
    if (!user || user.systemRole !== 'FOUNDER') return NextResponse.json({ error: 'Founder access required' }, { status: 403 })
    const parsed = taskInput.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid task' }, { status: 400 })
    const task = await prisma.task.create({ data: { ...parsed.data, dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined, organizationId: user.organizationId, creatorId: user.id }, include: { assignee: true } })
    return NextResponse.json(task, { status: 201 })
  })
}
