import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
  } catch (error: unknown) {
    // Vérifie si c’est une vraie erreur JS avec un message
    const message =
      error instanceof Error ? error.message : "Erreur inconnue";

    console.error("Erreur lors de la récupération des conférences :", message);

    return NextResponse.json(
      { message: "Erreur serveur", error: message },
      { status: 500 }
    );
  }
}
