import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { createTransport } from "nodemailer";
import QRCode from "qrcode";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { nom, prenom, telephone, email, conferenceId } = await req.json();

    // 1️⃣ Génération du QR Code
    const qrData = `${nom} ${prenom} - ${telephone} - ${email} - Conférence: ${conferenceId}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData);
    console.log("✅ QR Code généré :", qrCodeUrl);

    // 2️⃣ Enregistrement dans la base de données
    const participant = await prisma.participant.create({
      data: { nom, prenom, telephone, email, conferenceId, qrCode: qrCodeUrl }
    });
    console.log("✅ Participant enregistré :", participant);

    // 3️⃣ Configuration du transporteur SMTP
    const transporter = createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    // 4️⃣ Envoi de l'email avec le QR Code
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Confirmation d'inscription",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <p style="font-size: 16px; line-height: 1.6;">Cher/Chère Participant(e),</p>
  
  <p style="font-size: 16px; line-height: 1.6;">Nous sommes ravis de vous accueillir à la <strong>Conférence Carrefour Étudiant International</strong> !</p>

  <p style="font-size: 16px; line-height: 1.6;">Pour faciliter votre entrée, veuillez présenter ce QR Code à l'accueil. Il servira également d'accès à votre badge et aux différentes sessions.</p>

  <div style="text-align: center; margin: 25px 0;">
    <img src="${qrCodeUrl}" alt="QR Code d'accès" style="width:200px; height:200px; border: 1px solid #eee; padding: 10px; background: white;" />
  </div>

  <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #4e73df; margin: 20px 0;">
    <p style="font-size: 15px; margin: 0 0 10px 0; font-weight: bold;">📍 Conseils :</p>
    <ul style="margin: 0; padding-left: 20px;">
      <li style="margin-bottom: 8px;">Affichez ce QR Code en plein écran ou imprimez-le pour un scan rapide</li>
      <li style="margin-bottom: 8px;">Assurez-vous que la luminosité de votre téléphone est suffisante</li>
    </ul>
  </div>

  <p style="font-size: 16px; line-height: 1.6;">Nous vous souhaitons une excellente conférence et des échanges enrichissants !</p>

  <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">
    Cordialement,<br>
    <strong>L'équipe d'organisation</strong><br>
    <em style="color: #4e73df;">Carrefour Étudiant International</em>
  </p>
</div>
      `
    });

    return NextResponse.json({ message: "Inscription réussie, email envoyé !" });
  } catch (error) {
    console.error("❌ Erreur complète :", error);
    return NextResponse.json({ message: "Erreur lors de l'inscription" }, { status: 500 });
  }
}
