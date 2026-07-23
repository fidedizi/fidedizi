import "server-only";
import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER ?? "fidedizi@gmail.com";
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;

const transporter = EMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: EMAIL_USER, pass: EMAIL_APP_PASSWORD },
    })
  : null;

export async function sendEmail(to: string, subject: string, body: string) {
  if (!transporter) {
    console.log(
      `[E-mail] EMAIL_APP_PASSWORD não configurado — envio simulado para ${to}\nAssunto: ${subject}\n\n${body}`,
    );
    return;
  }

  await transporter.sendMail({
    from: `FideDizi <${EMAIL_USER}>`,
    to,
    subject,
    text: body,
  });
}
