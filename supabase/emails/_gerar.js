// Gera os modelos de e-mail (Supabase Auth). Rode: node _gerar.js
const fs = require('fs');
const LOGO = 'https://gabrielmartins05.github.io/ferro/icons/icon-192.png';
const T = {
  reset: {
    pt: { title: 'Redefinir sua senha', text: 'Recebemos um pedido para criar uma senha nova para a sua conta. Toque no botão abaixo para escolher a nova senha.', btn: 'Criar nova senha', note: 'O link vale por 1 hora. Se não foi você que pediu, pode ignorar este e-mail: sua senha continua a mesma.' },
    en: { title: 'Reset your password', text: 'We got a request to create a new password for your account. Tap the button below to choose your new password.', btn: 'Create new password', note: 'This link is valid for 1 hour. If you didn\'t ask for this, you can ignore this email: your password stays the same.' },
    es: { title: 'Restablece tu contraseña', text: 'Recibimos una solicitud para crear una contraseña nueva para tu cuenta. Toca el botón de abajo para elegir la nueva contraseña.', btn: 'Crear nueva contraseña', note: 'El enlace vale por 1 hora. Si no fuiste tú, puedes ignorar este correo: tu contraseña sigue igual.' }
  },
  confirm: {
    pt: { title: 'Confirme seu e-mail', text: 'Falta só um passo para ativar sua conta. Toque no botão abaixo para confirmar seu e-mail e começar a subir de nível.', btn: 'Confirmar e-mail', note: 'Se você não criou uma conta no Fitness, pode ignorar este e-mail.' },
    en: { title: 'Confirm your email', text: 'Just one step left to activate your account. Tap the button below to confirm your email and start leveling up.', btn: 'Confirm email', note: 'If you didn\'t create a Fitness account, you can ignore this email.' },
    es: { title: 'Confirma tu correo', text: 'Solo falta un paso para activar tu cuenta. Toca el botón de abajo para confirmar tu correo y empezar a subir de nivel.', btn: 'Confirmar correo', note: 'Si no creaste una cuenta en Fitness, puedes ignorar este correo.' }
  }
};
const LINK = { pt: 'Se o botão não funcionar, copie e cole este link no navegador:', en: 'If the button doesn\'t work, copy and paste this link into your browser:', es: 'Si el botón no funciona, copia y pega este enlace en el navegador:' };
const TAG = { pt: 'Treino, comida e foco. Suba de nível.', en: 'Training, food and focus. Level up.', es: 'Entrenamiento, comida y enfoque. Sube de nivel.' };

function body(c, l, url) {
  return `<p style="margin:0 0 8px;font-size:24px;line-height:1.25;font-weight:700;color:#ffffff">${c.title}</p>
<p style="margin:0 0 26px;font-size:16px;line-height:1.55;color:#c4c5cc">${c.text}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:14px;background:#ffffff">
<a href="${url}" style="display:inline-block;padding:15px 28px;font-size:16px;font-weight:700;color:#141418;text-decoration:none;border-radius:14px">${c.btn}</a>
</td></tr></table>
<p style="margin:26px 0 0;font-size:13px;line-height:1.5;color:#8a8b94">${c.note}</p>
<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#6e7079">${LINK[l]}<br><a href="${url}" style="color:#7fdfc6;word-break:break-all">${url}</a></p>`;
}
function page(inner, tag) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"></head>
<body style="margin:0;padding:0;background:#0e0f12">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0e0f12"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;font-family:Inter,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<tr><td align="center" style="padding:0 0 22px">
<img src="${LOGO}" width="64" height="64" alt="Fitness" style="display:block;border:0;border-radius:16px">
<p style="margin:12px 0 0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-.2px">Fitness</p>
</td></tr>
<tr><td style="background:#17181c;border-radius:20px;padding:30px 26px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px"><tr>
<td height="4" style="background:#f6a6c8;border-radius:4px 0 0 4px;font-size:0;line-height:0">&nbsp;</td>
<td height="4" style="background:#7fdfc6;font-size:0;line-height:0">&nbsp;</td>
<td height="4" style="background:#b8a1ff;border-radius:0 4px 4px 0;font-size:0;line-height:0">&nbsp;</td>
</tr></table>
${inner}
</td></tr>
<tr><td align="center" style="padding:20px 10px 0;font-size:12px;line-height:1.6;color:#6e7079">${tag}<br>
<a href="https://gabrielmartins05.github.io/ferro/privacidade.html" style="color:#8a8b94">Privacidade · Privacy · Privacidad</a></td></tr>
</table></td></tr></table></body></html>`;
}
// modelo do Supabase: escolhe a língua pelo user_metadata.lang (padrão português)
for (const kind of ['reset', 'confirm']) {
  const url = '{{ .ConfirmationURL }}';
  const v = (l) => body(T[kind][l], l, url);
  const tag = (l) => TAG[l];
  const tpl = `{{ $l := or .Data.lang "pt" }}{{ if eq $l "en" }}${page(v('en'), tag('en'))}{{ else if eq $l "es" }}${page(v('es'), tag('es'))}{{ else }}${page(v('pt'), tag('pt'))}{{ end }}`;
  const subj = `{{ $l := or .Data.lang "pt" }}{{ if eq $l "en" }}${T[kind].en.title}{{ else if eq $l "es" }}${T[kind].es.title}{{ else }}${T[kind].pt.title}{{ end }} · Fitness`;
  const name = kind === 'reset' ? 'redefinir-senha' : 'confirmar-email';
  fs.writeFileSync(name + '.html', tpl);
  fs.writeFileSync(name + '.assunto.txt', subj);
  // prévias para ver no navegador
  for (const l of ['pt', 'en', 'es']) fs.writeFileSync('_previa-' + name + '-' + l + '.html', page(body(T[kind][l], l, 'https://gabrielmartins05.github.io/ferro/#exemplo'), TAG[l]));
}
console.log('ok');
