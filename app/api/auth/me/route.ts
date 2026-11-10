import { NextResponse } from 'next/server'
import { handleApiErrors } from '@/lib/api'
import { getCurrentUser } from '@/lib/session'

export async function GET() {
  return handleApiErrors(async () => {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role, systemRole: user.systemRole })
  })
}
