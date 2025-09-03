// lib/mailer.ts
import type { SentMessageInfo } from "nodemailer";
export const runtime = "nodejs";

export async function getMailer() {
  const nodemailer = (await import("nodemailer")).default;

  const host = process.env.SMTP_HOST;
  // Fallback de pruebas si no hay host o es de ejemplo
  if (!host || /example\.com$/i.test(host)) {
    const test = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: test.user, pass: test.pass },
    });
    return {
      transporter,
      preview: true as const,
      getPreviewUrl: (info: SentMessageInfo) => nodemailer.getTestMessageUrl(info),
    };
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });

  return { transporter, preview: false as const, getPreviewUrl: (_: SentMessageInfo) => null as string | null };
}
