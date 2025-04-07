import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createTransport } from "nodemailer";
import QRCode from "qrcode";

const prisma = new PrismaClient();

interface ConferenceEmailInfo {
  titre: string;
  date: Date;
}

export async function POST(req: NextRequest) {
  try {
    const { nom, prenom, telephone, email, conferenceId, motivation } = await req.json();

    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId }
    });

    if (!conference) {
      return NextResponse.json(
        { message: "Conférence non trouvée" },
        { status: 404 }
      );
    }

    const existingParticipant = await prisma.participant.findUnique({
      where: { email }
    });

    if (existingParticipant) {
      return NextResponse.json(
        { message: "Cet email est déjà inscrit" },
        { status: 400 }
      );
    }

    const qrData = `${nom} ${prenom} | ${email} | ${conference.titre}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    await prisma.participant.create({
      data: {
        nom,
        prenom,
        telephone,
        email,
        conferenceId,
        qrCode: qrCodeUrl,
        motivation
      }
    });

    const transporter = createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Confirmation d&apos;inscription",
      html: generateEmailContent(
        nom,
        prenom,
        {
          titre: conference.titre,
          date: conference.date
        },
        motivation,
        qrCodeUrl
      )
    });

    return NextResponse.json({
      message: "Inscription réussie! Un email de confirmation a été envoyé."
    });

  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { message: "Erreur lors de l&apos;inscription" },
      { status: 500 }
    );
  }
}

function generateEmailContent(
  nom: string,
  prenom: string,
  conference: ConferenceEmailInfo,
  motivation: string,
  qrCodeUrl: string
) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Confirmation d&apos;inscription</h2>
      <p>Bonjour ${prenom} ${nom},</p>
      
      <h3>Détails de votre inscription :</h3>
      <p><strong>Conférence :</strong> ${conference.titre}</p>
      <p><strong>Date :</strong> ${new Date(conference.date).toLocaleDateString('fr-FR')}</p>
      
      <p><strong>Votre motivation :</strong><br>${motivation}</p>
      
      <div style="text-align: center; margin: 20px 0;">
        <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px;"/>
        <p style="font-size: 0.9rem;">Présentez ce QR Code à l&apos;entrée</p>
      </div>
      
      <p>Cordialement,<br>L&apos;équipe d&apos;organisation</p>
    </div>
  `;
}