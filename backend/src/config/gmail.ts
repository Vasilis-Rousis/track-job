import { google } from 'googleapis';
import { env } from './env';

export const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'openid',
  'email',
];

export function buildRawMessage(from: string, to: string, subject: string, body: string): string {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body,
  ].join('\r\n');
  return Buffer.from(message).toString('base64url');
}

export async function sendViaGmailApi(from: string, to: string, subject: string, body: string): Promise<void> {
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: buildRawMessage(from, to, subject, body) },
  });
}
