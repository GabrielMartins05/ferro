// Gera index.html (o app instalável) a partir de src/app.html.
// src/app.html também é a versão usada na prévia, que abre com dados de exemplo.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, 'src', 'app.html'), 'utf8');
const [head, body] = src.split('<!--BODY-->');
if (!body) throw new Error('Marcador <!--BODY--> não encontrado em src/app.html');

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#a9d9ff">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Ferro">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" href="icons/icon-192.png">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}img{max-width:100%}[hidden]{display:none!important}</style>
<script>window.FERRO_REAL = true;</script>
${head.trim()}
</head>
<body>
${body.trim()}
<script>
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () {});
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('index.html gerado (' + Math.round(html.length / 1024) + ' KB)');
