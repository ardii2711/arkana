import nodemailer from 'nodemailer';

import { env } from '../config/env.js';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 10_000;

const smtpTransport = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Produksi memakai Resend HTTP API (port 443) karena Render free memblokir
 * outbound SMTP 25/465/587. SMTP tetap dipakai lokal dan test (Mailpit).
 */
export async function sendMail({ to, subject, text, html }: MailOptions): Promise<void> {
  const apiKey = env.RESEND_API_KEY;

  if (apiKey) {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: env.MAIL_FROM, to, subject, text, html }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Resend gagal (${response.status}): ${body.slice(0, 500)}`);
    }

    return;
  }

  await smtpTransport.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
}
