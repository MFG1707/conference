import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Utilise l'instance unique de Prisma

export const dynamic = "force-dynamic"; // Assure que l'API ne soit pas mise en cache

export async function GET() {
  try {
    const conferences = await prisma.conference.findMany({
      select: { id: true, date: true, titre: true }
    });

    return NextResponse.json(conferences);
  } catch (error) {
    console.error("Erreur serveur :", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
