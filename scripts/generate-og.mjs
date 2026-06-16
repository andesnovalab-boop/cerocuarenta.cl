// Genera public/og-image.jpg (1200x630) para previews sociales.
// Uso: node scripts/generate-og.mjs
import sharp from "sharp";

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1020" cy="150" r="120" fill="#d4ff3f" opacity="0.95"/>
  <path d="M 945 95 Q 1020 150 945 205" stroke="#0a0a0a" stroke-width="4" fill="none" opacity="0.6"/>
  <path d="M 1095 95 Q 1020 150 1095 205" stroke="#0a0a0a" stroke-width="4" fill="none" opacity="0.6"/>
  <text x="100" y="320" font-family="Georgia, serif" font-style="italic" font-size="110" font-weight="700" fill="#ffffff">CeroCuarenta</text>
  <text x="105" y="390" font-family="Arial, sans-serif" font-size="34" letter-spacing="6" fill="#d4ff3f">TENNIS STREETWEAR</text>
  <text x="105" y="500" font-family="Arial, sans-serif" font-size="28" letter-spacing="2" fill="#ffffff" opacity="0.6">Estética vintage · Streetwear moderno · Santiago, Chile</text>
</svg>`;

await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile("public/og-image.jpg");
console.log("✓ public/og-image.jpg generado (1200x630)");
