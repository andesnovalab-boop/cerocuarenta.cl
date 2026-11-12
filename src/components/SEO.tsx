import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import paginas from "../seo-paginas.json";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  /** Ruta o URL canónica. Si se omite, se usa la ruta actual. */
  url?: string;
  type?: string;
  /** Datos estructurados schema.org. Si se omite, se usa el de tienda por defecto. */
  jsonLd?: Record<string, any>;
}

const SITE = "https://cerocuarenta.cl";

type Pagina = { title: string; description: string };
const PAGINAS = paginas as Record<string, Pagina>;

// Schema base de la tienda (se usa cuando la página no pasa uno propio)
const defaultJsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "CeroCuarenta",
  description: "Tennis streetwear: estética vintage y streetwear moderno desde Santiago, Chile.",
  url: SITE,
  image: `${SITE}/og-image.jpg`,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Santiago",
    addressRegion: "Región Metropolitana",
    addressCountry: "CL",
  },
};

/** "/club/" → "/club"; la portada queda "/". */
const normalizarRuta = (ruta: string) => (ruta.length > 1 ? ruta.replace(/\/+$/, "") : ruta);

/**
 * Título, descripción y canonical de cada página.
 * Las páginas fijas toman sus textos de `seo-paginas.json`, el mismo archivo que usa
 * `scripts/prerender-seo.mjs` para escribirlos en el HTML al compilar.
 * Las páginas dinámicas (producto, artículo) pasan sus props.
 */
export const SEO: React.FC<SEOProps> = ({ title, description, image = `${SITE}/og-image.jpg`, url, type = "website", jsonLd }) => {
  const ruta = normalizarRuta(useLocation().pathname);
  const fija = PAGINAS[ruta];

  const titulo = title ?? fija?.title ?? PAGINAS["/"].title;
  const siteTitle = titulo.includes("CeroCuarenta") ? titulo : `${titulo} | CeroCuarenta`;
  const desc = description ?? fija?.description ?? PAGINAS["/"].description;
  const destino = url ?? ruta;
  const canonical = destino.startsWith("http") ? destino : `${SITE}${destino === "/" ? "/" : destino}`;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="CeroCuarenta" />
      <meta property="og:locale" content="es_CL" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />

      {/* Datos estructurados */}
      <script type="application/ld+json">{JSON.stringify(jsonLd ?? defaultJsonLd)}</script>
    </Helmet>
  );
};
