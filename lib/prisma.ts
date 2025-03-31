import { PrismaClient } from '@prisma/client'

// Déclaration étendue de globalThis avec TypeScript
declare global {
  namespace NodeJS {
    interface Global {
      prisma?: PrismaClient;
    }
  }
}

// Solution compatible avec TypeScript et Next.js
const prisma: PrismaClient = (global as typeof globalThis & { prisma?: PrismaClient }).prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  (global as typeof globalThis & { prisma?: PrismaClient }).prisma = prisma;
}

export default prisma;