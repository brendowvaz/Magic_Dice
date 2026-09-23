function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildImageHtml(imageUrl: string): string {
  const url = new URL(imageUrl);
  if (url.protocol !== 'https:' || !url.hostname) {
    throw new Error('O link da imagem deve começar com https://.');
  }

  const safeUrl = escapeAttribute(imageUrl);
  return `<!doctype html>
<html lang="pt-BR">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td align="center" valign="middle" style="padding:40px 16px;text-align:center;">
          <img src="${safeUrl}" alt="Imagem dos dados" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;">
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
