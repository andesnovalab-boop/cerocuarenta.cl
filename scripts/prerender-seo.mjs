// Escribe un HTML por cada página fija del sitio con su propio título, descripción,
// canonical y Open Graph, para que Google y WhatsApp los vean sin ejecutar JavaScript.
//
// Corre después de `vite build` (ver "build" en package.json):
//   dist/index.html   → portada
//   dist/galeria.html → /galeria (el .htaccess sirve /galeria desde aquí)
//   ...
// Los textos salen de src/seo-paginas.json, el mismo archivo que usa components/SEO.tsx.

import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://cerocuarenta.cl";
const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(raiz, "dist");

const paginas = JSON.parse(readFileSync(join(raiz, "src", "seo-paginas.json"), "utf8"));
const base = readFileSync(join(dist, "index.html"), "utf8");

const escapar = (texto) =>
  texto.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Cambia el atributo `content`/`href` de la etiqueta data-prerender que calce con `selector`. */
function fijar(html, selector, atributo, valor) {
  const patron = new RegExp(`(<[a-z]+ data-prerender ${selector}[^>]*?${atributo}=")[^"]*(")`);
  if (!patron.test(html)) throw new Error(`No encontré la etiqueta ${selector} en dist/index.html`);
  return html.replace(patron, `$1${escapar(valor)}$2`);
}

for (const [ruta, { title, description }] of Object.entries(paginas)) {
  const url = ruta === "/" ? `${SITE}/` : `${SITE}${ruta}`;
  let html = base.replace(/<title>[^<]*<\/title>/, `<title>${escapar(title)}</title>`);
  html = fijar(html, 'name="description"', "content", description);
  html = fijar(html, 'rel="canonical"', "href", url);
  html = fijar(html, 'property="og:url"', "content", url);
  html = fijar(html, 'property="og:title"', "content", title);
  html = fijar(html, 'property="og:description"', "content", description);

  const archivo = ruta === "/" ? "index.html" : `${ruta.slice(1)}.html`;
  writeFileSync(join(dist, archivo), html);
  console.log(`  ${archivo.padEnd(14)} ${title}`);
}

// Base para las rutas sin HTML propio (/product/..., /admin, /checkout...): sin canonical ni og:url,
// porque los pone React Helmet con la ruta real. Si llevara el de la portada, Google trataría cada
// producto como copia de la portada. El .htaccess manda esas rutas aquí.
const spa = base
  .replace(/\s*<link data-prerender rel="canonical"[^>]*>/, "")
  .replace(/\s*<meta data-prerender property="og:url"[^>]*>/, "");
if (spa.includes('rel="canonical"')) throw new Error("spa.html quedó con canonical");
writeFileSync(join(dist, "spa.html"), spa);
console.log("  spa.html       (rutas de la tienda, sin canonical)");

// Vite no copia los archivos ocultos de public/ (el .htaccess); sin él, /galeria da 404.
const htaccess = join(raiz, "public", ".htaccess");
if (existsSync(htaccess)) copyFileSync(htaccess, join(dist, ".htaccess"));
