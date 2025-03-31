import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const participants = await prisma.participant.findMany({
      include: {
        conference: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(participants);
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des participants" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const newParticipant = await prisma.participant.create({
      data,
    });

    return NextResponse.json(
      { message: "Inscription réussie", participant: newParticipant },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}
