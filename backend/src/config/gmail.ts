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

function plainTextToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>\n');
}

export function buildRawMessage(from: string, to: string, subject: string, body: string): string {
  const encodedSubject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  const htmlBody = `<div style="font-family:sans-serif;font-size:14px;line-height:1.5">${plainTextToHtml(body)}</div>`;
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(htmlBody).toString('base64').match(/.{1,76}/g)!.join('\r\n'),
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
