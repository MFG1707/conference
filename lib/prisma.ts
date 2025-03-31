import { PrismaClient } from '@prisma/client'

declare global {
  // Permet d'avoir une instance unique de PrismaClient dans l'application
  let prisma: PrismaClient | undefined
}

const prisma = globalThis.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma