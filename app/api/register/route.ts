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

    if (!nom || !prenom || !telephone || !email || !conferenceId || !motivation) {
      return NextResponse.json(
        { message: "Tous les champs sont obligatoires" },
        { status: 400 }
      );
    }

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

    const transporter = createTransport({
      host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
      port: Number(process.env.EMAIL_SERVER_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER,
      to: email,
      subject: "🎓 Confirmation d'inscription - Carrefour Étudiant",
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

  } catch (error: unknown) {
    console.error("Erreur complète:", error);

    const errorMessage = "Une erreur est survenue lors de l'inscription";

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : undefined
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
  const formattedDate = new Date(conference.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: auto; padding: 20px; background: #f4f4f4; border-radius: 8px; color: #333;">
      <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="color: #2563eb; margin-bottom: 10px;">🎓 Confirmation d'inscription</h2>
        <p>Bonjour <strong>${prenom} ${nom}</strong>,</p>
        <p>Nous avons le plaisir de vous confirmer votre inscription à la conférence suivante :</p>
        <div style="margin: 20px 0; padding: 20px; background: #f0f4ff; border-left: 5px solid #2563eb; border-radius: 5px;">
          <p><strong>📌 Thème :</strong> ${conference.titre}</p>
          <p><strong>📅 Date :</strong> ${formattedDate}</p>
        </div>

        <p><strong>💬 Votre motivation :</strong></p>
        <blockquote style="margin: 10px 0; padding: 10px 20px; background: #fff; border-left: 3px solid #2563eb; font-style: italic;">
          ${motivation}
        </blockquote>

        <div style="text-align: center; margin: 30px 0;">
          <img src="${qrCodeUrl}" alt="QR Code d'accès" style="width: 200px; height: 200px; background: white; border: 1px solid #ddd; padding: 10px;" />
          <p style="color: #666; margin-top: 10px;">Présentez ce QR Code à l'entrée de la conférence</p>
        </div>

        <p>Nous avons hâte de vous accueillir lors de cet événement enrichissant.</p>

        <p style="margin-top: 40px;">Cordialement,</p>
        <p><strong>📚 L’équipe du Carrefour Étudiant International</strong></p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />
        <p style="font-size: 0.9em; color: #888;">Si vous avez des questions, n'hésitez pas à nous contacter à : <a href="mailto:${process.env.EMAIL_FROM || "carrefour@example.com"}" style="color: #2563eb;">${process.env.EMAIL_FROM || "carrefour@example.com"}</a></p>
      </div>
    </div>
  `;
}
