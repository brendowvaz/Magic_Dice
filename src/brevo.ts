export type SendImageEmailInput = {
  apiKey: string;
  senderEmail: string;
  recipientEmail: string;
  imageUrl: string;
};

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const EMAIL_SUBJECT = 'Uma imagem para você';

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildImageEmailHtml(imageUrl: string): string {
  if (!isValidImageUrl(imageUrl)) throw new Error('O link da imagem deve começar com https://.');
  const safeUrl = escapeAttribute(imageUrl);

  return `<!doctype html>
<html lang="pt-BR">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td align="center" valign="middle" style="padding:40px 16px;text-align:center;">
          <a href="${safeUrl}" style="display:inline-block;text-decoration:none;">
            <img src="${safeUrl}" alt="Imagem enviada pela Calculadora" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;">
          </a>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendImageEmail(input: SendImageEmailInput): Promise<string | null> {
  const apiKey = input.apiKey.trim();
  const senderEmail = input.senderEmail.trim();
  const recipientEmail = input.recipientEmail.trim();
  const imageUrl = input.imageUrl.trim();

  if (!apiKey) throw new Error('Configure a chave da API Brevo antes de enviar.');
  if (!isValidEmail(senderEmail)) throw new Error('O e-mail remetente é inválido.');
  if (!isValidEmail(recipientEmail)) throw new Error('Digite um e-mail de destino válido.');
  const htmlContent = buildImageEmailHtml(imageUrl);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let response: Response;

  try {
    response = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: 'Calculadora' },
        to: [{ email: recipientEmail }],
        subject: EMAIL_SUBJECT,
        htmlContent,
      }),
      signal: controller.signal,
    });
  } catch {
    throw new Error(controller.signal.aborted ? 'O envio demorou demais. Tente novamente.' : 'Não foi possível conectar à Brevo. Verifique sua conexão.');
  } finally {
    clearTimeout(timeout);
  }

  const result = await response.json().catch(() => null) as { message?: string; messageId?: string } | null;
  if (!response.ok) throw new Error(result?.message || `A Brevo recusou o envio (HTTP ${response.status}).`);
  return result?.messageId ?? null;
}
