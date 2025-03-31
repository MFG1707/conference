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
        <p>Merci pour votre inscription ! Voici votre QR Code :</p>
        <img src="${qrCodeUrl}" alt="QR Code" style="width:200px;height:200px;" />
      `
    });

    return NextResponse.json({ message: "Inscription réussie, email envoyé !" });
  } catch (error) {
    console.error("❌ Erreur complète :", error);
    return NextResponse.json({ message: "Erreur lors de l'inscription" }, { status: 500 });
  }
}
