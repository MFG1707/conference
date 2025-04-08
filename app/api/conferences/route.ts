import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Utilise l'instance unique de Prisma

export const dynamic = "force-dynamic"; // Empêche la mise en cache côté serveur

export async function GET() {
  try {
    const conferences = await prisma.conference.findMany({
      select: {
        id: true,
        date: true,
        titre: true,
      },
    });

    return NextResponse.json(conferences);
  } catch (error: any) {
    // Log complet côté serveur
    console.error("Erreur lors de la récupération des conférences :", error);

    // Réponse avec plus de détails pour le debug
    return NextResponse.json(
      {
        message: "Erreur serveur",
        error: error?.message || "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
