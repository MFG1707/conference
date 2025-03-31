import { PrismaClient } from '@prisma/client'

// Déclaration étendue de globalThis sans utiliser namespace
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// Solution compatible avec TypeScript et Next.js
const prisma: PrismaClient = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

export default prisma