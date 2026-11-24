// Gera index.html (site / GitHub Pages) e a pasta www/ (app nativo via Capacitor).
const fs = require('fs');
const path = require('path');
const R = (...p) => path.join(__dirname, ...p);

const cfg = JSON.parse(fs.readFileSync(R('config.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(R('package.json'), 'utf8'));
cfg.version = pkg.version;

const foods = JSON.parse(fs.readFileSync(R('src', 'foods.json'), 'utf8'));
const inject = `<script>window.FERRO_REAL = true; window.FITNESS_CONFIG = ${JSON.stringify(cfg)}; window.FITNESS_FOODS = ${JSON.stringify(foods)};</script>`;

// painel de admin: src/admin.html com a mesma configuração
const admin = fs.readFileSync(R('src', 'admin.html'), 'utf8').replace('<!--INJECT-->', inject + '\n<script src="vendor/supabase.js"></script>');
fs.writeFileSync(R('admin.html'), admin);
const del = fs.readFileSync(R('src', 'excluir-conta.html'), 'utf8').replace('<!--INJECT-->', inject + '\n<script src="vendor/supabase.js"></script>');
fs.writeFileSync(R('excluir-conta.html'), del);

const src = fs.readFileSync(R('src', 'app.html'), 'utf8');
const [head, body] = src.split('<!--BODY-->');
if (!body) throw new Error('Marcador <!--BODY--> não encontrado em src/app.html');

// supabase-js vem do npm e fica numa cópia local, para funcionar offline e dentro do app nativo
fs.mkdirSync(R('vendor'), { recursive: true });
fs.copyFileSync(R('node_modules', '@supabase', 'supabase-js', 'dist', 'umd', 'supabase.js'), R('vendor', 'supabase.js'));

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0e0f12">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Fitness">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" href="icons/icon-192.png">
<style>:root{padding-top:max(env(safe-area-inset-top,0px),var(--safe-area-inset-top,0px));padding-bottom:max(env(safe-area-inset-bottom,0px),var(--safe-area-inset-bottom,0px))}img{max-width:100%}[hidden]{display:none!important}</style>
${inject}
<script src="vendor/supabase.js"></script>
${head.trim()}
</head>
<body>
${body.trim()}
<script>
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {});
</script>
</body>
</html>
`;
fs.writeFileSync(R('index.html'), html);

// pasta www para o Capacitor
const WWW = R('www');
fs.rmSync(WWW, { recursive: true, force: true });
fs.mkdirSync(WWW);
for (const f of ['index.html', 'admin.html', 'excluir-conta.html', 'privacidade.html', 'termos.html', 'manifest.webmanifest', 'sw.js']) {
  if (fs.existsSync(R(f))) fs.copyFileSync(R(f), path.join(WWW, f));
}
for (const d of ['icons', 'vendor']) fs.cpSync(R(d), path.join(WWW, d), { recursive: true });

console.log('index.html gerado (' + Math.round(html.length / 1024) + ' KB) e www/ atualizada' + (cfg.supabaseUrl ? '' : ' — sem Supabase configurado (modo só no aparelho)'));
