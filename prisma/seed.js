// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const conferences = [
    {
      date: new Date('2025-04-14'),
      titre: "Conférence Carrefour Étudiant - Avril 2025 (Session 1)",
      capacite: 200
    },
    {
      date: new Date('2025-04-15'),
      titre: "Conférence Carrefour Étudiant - Avril 2025 (Session 2)",
      capacite: 200
    },
    {
      date: new Date('2025-04-17'),
      titre: "Conférence Carrefour Étudiant - Avril 2025 (Session 3)",
      capacite: 200
    },
    
  ]

  for (const conference of conferences) {
    await prisma.conference.create({ data: conference })
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())