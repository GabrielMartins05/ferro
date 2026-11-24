// Logo do Fitness: bola azul-índigo com três faixas (rosa, verde-água, roxo) saindo da esquerda.
// Uso: node assets/logo.js  -> gera assets/logo.svg, assets/logo-square.svg e o trecho usado no app
const fs = require('fs'), path = require('path');

function logo(id, square) {
  const bg = square
    ? `<rect width="100" height="100" fill="url(#${id}bg)"/>`
    : `<circle cx="50" cy="50" r="50" fill="url(#${id}bg)"/>`;
  const clip = square ? '' : ` clip-path="url(#${id}c)"`;
  const bar = (y, w, g, tip) => `<rect x="-6" y="${y}" width="${w + 6}" height="17" rx="8.5" fill="url(#${id}${g})"/><circle cx="${w - 8.5}" cy="${y + 8.5}" r="4.6" fill="${tip}" opacity=".85"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>
<radialGradient id="${id}bg" cx=".68" cy=".25" r=".85"><stop offset="0" stop-color="#3f56ff"/><stop offset=".55" stop-color="#2228c4"/><stop offset="1" stop-color="#121470"/></radialGradient>
<linearGradient id="${id}p" x1="0" x2="1"><stop offset="0" stop-color="#7a3fae" stop-opacity=".35"/><stop offset=".7" stop-color="#e27ad0"/><stop offset="1" stop-color="#ff9fd2"/></linearGradient>
<linearGradient id="${id}t" x1="0" x2="1"><stop offset="0" stop-color="#1d6fb8" stop-opacity=".35"/><stop offset=".7" stop-color="#3fd6dc"/><stop offset="1" stop-color="#8ff7e6"/></linearGradient>
<linearGradient id="${id}l" x1="0" x2="1"><stop offset="0" stop-color="#4b2fb0" stop-opacity=".35"/><stop offset=".7" stop-color="#a67cff"/><stop offset="1" stop-color="#d2b8ff"/></linearGradient>
${square ? '' : `<clipPath id="${id}c"><circle cx="50" cy="50" r="50"/></clipPath>`}
</defs>${bg}<g${clip}>${bar(20, 70, 'p', '#ffd1ea')}${bar(41.5, 90, 't', '#d4fff6')}${bar(63, 70, 'l', '#eadcff')}</g></svg>`;
}

const dir = __dirname;
fs.writeFileSync(path.join(dir, 'logo.svg'), logo('lg', false));
fs.writeFileSync(path.join(dir, 'logo-square.svg'), logo('lq', true));
module.exports = logo;
console.log('ok');
