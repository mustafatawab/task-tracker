import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/session'
import { handleApiErrors } from '@/lib/api'
import { assertSameOrigin } from '@/lib/csrf'

// Founder-only: toggle a member's active flag. Deactivated members
// cannot log in (login returns a "notify your admin" message).
// Founder accounts can never be deactivated here.
const updateInput = z.object({ active: z.boolean() })

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleApiErrors(async () => {
    const csrf = assertSameOrigin(request)
    if (csrf) return csrf
    const user = await getCurrentUser()
    if (!user || user.systemRole !== 'FOUNDER') return NextResponse.json({ error: 'Founder access required' }, { status: 403 })
    const { id } = await params
    const parsed = updateInput.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid update' }, { status: 400 })

    const target = await prisma.user.findUnique({ where: { id } })
    if (!target || target.organizationId !== user.organizationId) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (target.systemRole === 'FOUNDER') return NextResponse.json({ error: 'Founder accounts cannot be deactivated' }, { status: 403 })
    if (target.id === user.id) return NextResponse.json({ error: 'You cannot deactivate yourself' }, { status: 403 })

    const updated = await prisma.user.update({ where: { id }, data: { active: parsed.data.active }, select: { id: true, active: true } })
    return NextResponse.json(updated)
  })
}
