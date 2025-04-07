import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createTransport } from "nodemailer";
import QRCode from "qrcode";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { nom, prenom, telephone, email, conferenceId, motivation } = await req.json();

    // Vérifier la conférence
    const conference = await prisma.conference.findUnique({
      where: { id: conferenceId }
    });

    if (!conference) {
      return NextResponse.json(
        { message: "Conférence non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier email existant
    const existingParticipant = await prisma.participant.findUnique({
      where: { email }
    });

    if (existingParticipant) {
      return NextResponse.json(
        { message: "Email déjà inscrit" },
        { status: 400 }
      );
    }

    // Générer QR Code
    const qrData = `${nom} ${prenom} | ${email} | ${conference.titre}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    // Créer participant avec validation de type explicite
    const participantData = {
      nom,
      prenom,
      telephone,
      email,
      conferenceId,
      qrCode: qrCodeUrl,
      motivation
    };

    await prisma.participant.create({
      data: participantData
    });

    // Envoyer email
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
      subject: "Confirmation d'inscription",
      html: generateEmailContent(nom, prenom, conference, motivation, qrCodeUrl)
    });

    return NextResponse.json({
      message: "Inscription réussie! Un email de confirmation a été envoyé."
    });

  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json(
      { message: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}

function generateEmailContent(nom: string, prenom: string, conference: any, motivation: string, qrCodeUrl: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Confirmation d'inscription</h2>
      <p>Bonjour ${prenom} ${nom},</p>
      
      <h3>Détails de votre inscription :</h3>
      <p><strong>Conférence :</strong> ${conference.titre}</p>
      <p><strong>Date :</strong> ${new Date(conference.date).toLocaleDateString('fr-FR')}</p>
      
      <p><strong>Votre motivation :</strong><br>${motivation}</p>
      
      <div style="text-align: center; margin: 20px 0;">
        <img src="${qrCodeUrl}" alt="QR Code" style="width: 200px;"/>
        <p style="font-size: 0.9rem;">Présentez ce QR Code à l'entrée</p>
      </div>
      
      <p>Cordialement,<br>L'équipe d'organisation</p>
    </div>
  `;
}