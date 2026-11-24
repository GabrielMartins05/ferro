// Coloca a logo nova dentro do app (src/app.html) e prepara as páginas usadas para gerar os PNGs dos ícones
const fs = require('fs'), path = require('path');
const logo = require('./logo.js');
const root = path.join(__dirname, '..');

// 1) dentro do app: constantes BRAND (topo e barra lateral) e LOGO (tela de login)
const appPath = path.join(root, 'src', 'app.html');
let s = fs.readFileSync(appPath, 'utf8');
const inline = (id, cls) => logo(id, false).replace(' xmlns="http://www.w3.org/2000/svg"', '').replace('<svg ', '<svg ' + (cls ? 'class="' + cls + '" ' : '') + 'aria-hidden="true" ').replace(/\n/g, '');
const setConst = (name, val) => {
  const re = new RegExp('^const ' + name + " = '.*';$", 'm');
  if (!re.test(s)) throw new Error('não achei a constante ' + name);
  s = s.replace(re, 'const ' + name + " = '" + val.replace(/'/g, "\\'") + "';");
};
setConst('BRAND', inline('lgb'));
setConst('LOGO', inline('lga', 'logo'));
fs.writeFileSync(appPath, s);

// 2) páginas para o Chrome tirar "foto" dos ícones
const out = path.join(root, 'assets', '_render'); fs.mkdirSync(out, { recursive: true });
const page = (svg, size, bg) => `<html><body style="margin:0;background:${bg || 'transparent'}"><div style="width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div></body></html>`;
const items = [
  ['icon-192', 192, false], ['icon-512', 512, false], ['icon-maskable-512', 512, true], ['apple-touch-icon', 180, true], ['icon-1024', 1024, true]
];
for (const [n, size, sq] of items) fs.writeFileSync(path.join(out, n + '.html'), page(logo('r' + n.replace(/\W/g, ''), sq), size));
console.log('app atualizado e páginas dos ícones prontas em assets/_render');
