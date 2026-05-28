import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
  from,
}: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}) {
  const fromAddress = from ?? `LensLink <${process.env.RESEND_FROM_EMAIL}>`;
  return resend.emails.send({ from: fromAddress, to, subject, html });
}
