import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { handleApiErrors } from '@/lib/api'

const updateInput = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assigneeId: z.string().min(1).optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleApiErrors(async () => {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const parsed = updateInput.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid update' }, { status: 400 })

    const task = await prisma.task.findUnique({ where: { id } })
    if (!task || task.organizationId !== user.organizationId) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

    const isFounder = user.systemRole === 'FOUNDER'
    if (!isFounder) {
      if (task.assigneeId !== user.id) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
      if (parsed.data.priority !== undefined || parsed.data.assigneeId !== undefined) {
        return NextResponse.json({ error: 'Only status changes are allowed' }, { status: 403 })
      }
    }

    const updated = await prisma.task.update({ where: { id }, data: parsed.data, include: { assignee: { select: { id: true, name: true, role: true } } } })
    return NextResponse.json(updated)
  })
}
