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

    // Validation des données requises
    if (!nom || !prenom || !telephone || !email || !conferenceId || !motivation) {
      return NextResponse.json(
        { message: "Tous les champs sont obligatoires" },
        { status: 400 }
      );
    }

    // Vérification du format email
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Adresse email invalide" },
        { status: 400 }
      );
    }

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
        { message: "Cet email est déjà inscrit à cette conférence" },
        { status: 400 }
      );
    }

    const qrData = `${nom} ${prenom} | ${email} | ${conference.titre} | ${new Date().toISOString()}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    await prisma.participant.create({
      data: {
        nom,
        prenom,
        telephone,
        email,
        conferenceId,
        qrCode: qrCodeUrl,
        motivation,
        createdAt: new Date()
      }
    });

    // Configuration SMTP plus robuste
    const transporter = createTransport({
      host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_SERVER_PORT) || 587,
      secure: false, // true pour le port 465
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD
      },
      tls: {
        rejectUnauthorized: false // Nécessaire pour certains environnements
      }
    });

    // Envoi de l'email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
      to: email,
      subject: "Confirmation d'inscription - Carrefour Étudiant",
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
      success: true,
      message: "Inscription réussie ! Un email de confirmation a été envoyé."
    });

  } catch (error) {
    console.error("Erreur complète:", error);
    
    let errorMessage = "Une erreur est survenue lors de l'inscription";
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }

    return NextResponse.json(
      { 
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      },
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
  const formattedDate = new Date(conference.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2563eb; border-bottom: 1px solid #eee; padding-bottom: 10px;">
        Confirmation d'inscription
      </h2>
      
      <p>Bonjour ${prenom} ${nom},</p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Détails de votre inscription :</h3>
        <p><strong>Conférence :</strong> ${conference.titre}</p>
        <p><strong>Date :</strong> ${formattedDate}</p>
      </div>
      
      <div style="margin: 20px 0;">
        <h4>Votre motivation :</h4>
        <p style="background: #fff; padding: 10px; border-left: 3px solid #2563eb;">
          ${motivation}
        </p>
      </div>
      
      <div style="text-align: center; margin: 25px 0;">
        <img src="${qrCodeUrl}" alt="QR Code d'accès" style="width: 200px; height: 200px; border: 1px solid #eee; padding: 10px; background: white;"/>
        <p style="font-size: 0.9rem; color: #666;">
          Présentez ce QR Code à l'entrée de la conférence
        </p>
      </div>
      
      <div style="font-size: 0.9rem; color: #777; border-top: 1px solid #eee; padding-top: 15px;">
        <p>Cordialement,</p>
        <p><strong>L'équipe du Carrefour Étudiant International</strong></p>
        <p>Contact : ${process.env.EMAIL_FROM || 'carrefouretudiant229@gmail.com'}</p>
      </div>
    </div>
  `;
}