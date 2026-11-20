const mailpitUrl = process.env.MAILPIT_URL ?? 'http://localhost:8025';

interface MailpitMessageSummary {
  ID: string;
  To: { Address: string; Name?: string }[];
  Subject: string;
}

interface MailpitMessage extends MailpitMessageSummary {
  Text: string;
  HTML: string;
}

export async function clearMailbox(): Promise<void> {
  const response = await fetch(`${mailpitUrl}/api/v1/messages`, { method: 'DELETE' });

  if (!response.ok) {
    throw new Error(`Gagal membersihkan Mailpit (${response.status}). Pastikan Mailpit berjalan.`);
  }
}

async function messages(): Promise<MailpitMessageSummary[]> {
  const response = await fetch(`${mailpitUrl}/api/v1/messages?limit=50`);

  if (!response.ok) {
    throw new Error(`Gagal membaca Mailpit (${response.status}). Pastikan Mailpit berjalan.`);
  }

  const body = (await response.json()) as { messages?: MailpitMessageSummary[] };

  return body.messages ?? [];
}

/** Menunggu email terbaru untuk alamat tujuan lalu mengembalikan isinya. */
export async function waitForEmail(to: string, timeoutMs = 15_000): Promise<MailpitMessage> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const match = (await messages()).find((message) =>
      message.To.some((recipient) => recipient.Address.toLowerCase() === to.toLowerCase()),
    );

    if (match) {
      const response = await fetch(`${mailpitUrl}/api/v1/message/${match.ID}`);

      if (!response.ok) {
        throw new Error(`Gagal membaca pesan Mailpit (${response.status})`);
      }

      return (await response.json()) as MailpitMessage;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Email untuk ${to} tidak diterima dalam ${timeoutMs} ms`);
}

/** Mengambil token dari tautan di isi email. */
export function extractToken(text: string, query = 'token'): string {
  const match = new RegExp(`[?&]${query}=([A-Za-z0-9_-]+)`).exec(text);

  if (!match?.[1]) {
    throw new Error(`Token "${query}" tidak ditemukan pada isi email`);
  }

  return match[1];
}
