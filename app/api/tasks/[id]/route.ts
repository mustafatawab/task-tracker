import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { handleApiErrors } from '@/lib/api'
import { assertSameOrigin } from '@/lib/csrf'

const updateInput = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assigneeId: z.string().min(1).optional(),
  // Founder-only fields (members may only move status)
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(1000).optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleApiErrors(async () => {
    const csrf = assertSameOrigin(request)
    if (csrf) return csrf
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const parsed = updateInput.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid update' }, { status: 400 })

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task || task.organizationId !== user.organizationId) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    if (task.deletedAt) return NextResponse.json({ error: 'Task is deleted' }, { status: 404 })

    const isFounder = user.systemRole === 'FOUNDER'
    if (!isFounder) {
      if (task.assigneeId !== user.id) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
      // Members: status-only on their own tasks.
      if (parsed.data.priority !== undefined || parsed.data.assigneeId !== undefined || parsed.data.title !== undefined || parsed.data.description !== undefined) {
        return NextResponse.json({ error: 'Only status changes are allowed' }, { status: 403 })
      }
    }

    const updated = await prisma.task.update({ where: { id }, data: parsed.data, include: { assignee: { select: { id: true, name: true, role: true } } } })
    return NextResponse.json(updated)
  })
}

// Soft delete — founder-only. Sets deletedAt; the row stays in the DB
// but the task is never restorable (no restore endpoint exists).
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleApiErrors(async () => {
    const csrf = assertSameOrigin(request)
    if (csrf) return csrf
    const user = await getCurrentUser()
    if (!user || user.systemRole !== 'FOUNDER') return NextResponse.json({ error: 'Founder access required' }, { status: 403 })
    const { id } = await params

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task || task.organizationId !== user.organizationId) return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    if (task.deletedAt) return NextResponse.json({ error: 'Task is already deleted' }, { status: 409 })

    await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ ok: true })
  })
}
