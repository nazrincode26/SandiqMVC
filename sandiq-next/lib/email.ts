import "server-only";
import nodemailer from "nodemailer";

/** Services/EmailService.SendPasswordResetEmailAsync — same subject and text. */
export async function sendPasswordResetEmail(toEmail: string, resetCode: string) {
  const host = process.env.SMTP_HOST;
  const username = process.env.SMTP_USERNAME;
  const password = process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT || 587);
  const fromName = process.env.SMTP_FROM_NAME || "Sandıq";

  const subject = "Sandıq - Şifrə sıfırlama";
  const text = `Salam,\n\nŞifrənizi sıfırlamaq üçün bu kodu istifadə edin: ${resetCode}\n\nBu kod 15 dəqiqə etibarlıdır.\n\nƏgər bu sorğunu siz göndərməmisinizsə, bu mesajı nəzərə almayın.\n\nSandıq komandası`;

  if (!host || !username || !password) {
    if (process.env.NODE_ENV !== "production") {
      // Local development without SMTP settings: print the email instead of sending it.
      console.info(`[email:dev] To: ${toEmail}\nSubject: ${subject}\n\n${text}`);
      return;
    }
    throw new Error("SMTP is not configured (SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD).");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 587 uses STARTTLS, as in the original MailKit setup
    requireTLS: port !== 465,
    auth: { user: username, pass: password },
  });

  await transporter.sendMail({
    from: { name: fromName, address: username },
    to: toEmail,
    subject,
    text,
  });
}
