import { env } from '../config/env.js';
import { sendMail } from './mailer.js';

function appLink(path: string): string {
  return `${env.CORS_ORIGIN}${path}`;
}

export async function sendInvitationEmail(
  name: string,
  email: string,
  token: string,
): Promise<void> {
  const link = appLink(`/activate?token=${token}`);

  await sendMail({
    to: email,
    subject: 'Undangan akun ARKANA',
    text: `Halo ${name},\n\nAkun ARKANA Anda telah dibuat. Aktifkan akun dan atur password melalui tautan berikut:\n${link}\n\nTautan berlaku 7 hari.`,
    html: `<p>Halo ${name},</p><p>Akun ARKANA Anda telah dibuat. Aktifkan akun dan atur password melalui tautan berikut:</p><p><a href="${link}">Aktifkan akun</a></p><p>Tautan berlaku 7 hari.</p>`,
  });
}

export async function sendEmailChangeLink(
  name: string,
  email: string,
  token: string,
): Promise<void> {
  const link = appLink(`/verifikasi-email?token=${token}`);

  await sendMail({
    to: email,
    subject: 'Verifikasi email akun ARKANA',
    text: `Halo ${name},\n\nAnda meminta perubahan email akun ARKANA ke alamat ini. Klik tautan berikut untuk memverifikasinya:\n${link}\n\nTautan berlaku 7 hari. Jika bukan Anda yang meminta, abaikan email ini.`,
    html: `<p>Halo ${name},</p><p>Anda meminta perubahan email akun ARKANA ke alamat ini. Klik tautan berikut untuk memverifikasinya:</p><p><a href="${link}">Verifikasi email</a></p><p>Tautan berlaku 7 hari. Jika bukan Anda yang meminta, abaikan email ini.</p>`,
  });
}

export async function notifyAccountActivated(name: string, email: string): Promise<void> {
  const link = appLink('/login');

  await sendMail({
    to: email,
    subject: 'Akun ARKANA Anda aktif',
    text: `Halo ${name},\n\nAkun ARKANA Anda sudah aktif. Silakan login melalui ${link}`,
    html: `<p>Halo ${name},</p><p>Akun ARKANA Anda sudah aktif.</p><p><a href="${link}">Login ke ARKANA</a></p>`,
  });
}

export async function notifyEmailChanged(
  name: string,
  oldEmail: string,
  newEmail: string,
): Promise<void> {
  await Promise.all([
    sendMail({
      to: oldEmail,
      subject: 'Email akun ARKANA diubah',
      text: `Halo ${name},\n\nEmail akun ARKANA Anda diubah menjadi ${newEmail}. Jika bukan Anda yang meminta, segera hubungi Admin.`,
      html: `<p>Halo ${name},</p><p>Email akun ARKANA Anda diubah menjadi <strong>${newEmail}</strong>.</p><p>Jika bukan Anda yang meminta, segera hubungi Admin.</p>`,
    }),
    sendMail({
      to: newEmail,
      subject: 'Email akun ARKANA diperbarui',
      text: `Halo ${name},\n\nEmail akun ARKANA Anda telah diperbarui ke alamat ini. Silakan login melalui ${appLink('/login')}`,
      html: `<p>Halo ${name},</p><p>Email akun ARKANA Anda telah diperbarui ke alamat ini.</p><p><a href="${appLink('/login')}">Login ke ARKANA</a></p>`,
    }),
  ]);
}

export async function notifyAccountDeactivated(name: string, email: string): Promise<void> {
  await sendMail({
    to: email,
    subject: 'Akun ARKANA dinonaktifkan',
    text: `Halo ${name},\n\nAkun ARKANA Anda telah dinonaktifkan. Data Anda tetap tersimpan. Hubungi Admin jika perlu diaktifkan kembali.`,
    html: `<p>Halo ${name},</p><p>Akun ARKANA Anda telah dinonaktifkan. Data Anda tetap tersimpan.</p><p>Hubungi Admin jika perlu diaktifkan kembali.</p>`,
  });
}
