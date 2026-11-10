import { PrismaClient } from './generated/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('Admin@12', 12)
  const organization = await prisma.organization.upsert({ where: { id: 'farsight-systems' }, update: {}, create: { id: 'farsight-systems', name: 'Farsight Systems' } })
  await prisma.user.upsert({ where: { email: 'mustafa.tawab.dev@gmail.com' }, update: { name: 'Mustafa Tawab', role: 'Founder', systemRole: 'FOUNDER', passwordHash, organizationId: organization.id }, create: { name: 'Mustafa Tawab', email: 'mustafa.tawab.dev@gmail.com', role: 'Founder', systemRole: 'FOUNDER', passwordHash, organizationId: organization.id } })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
