import React from "react";
import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  /** Datos estructurados schema.org. Si se omite, se usa el de tienda por defecto. */
  jsonLd?: Record<string, any>;
}

const SITE = "https://cerocuarenta.cl";

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

export const SEO: React.FC<SEOProps> = ({
  title = "CeroCuarenta | Tennis Streetwear Santiago",
  description = "Inspirada en el tenis, creada para ti. CeroCuarenta mezcla estética vintage con streetwear moderno en Santiago, Chile.",
  image = `${SITE}/og-image.jpg`,
  url = SITE,
  type = "website",
  jsonLd,
}) => {
  const siteTitle = title.includes("CeroCuarenta") ? title : `${title} | CeroCuarenta`;
  const canonical = url.startsWith("http") ? url : `${SITE}${url}`;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="CeroCuarenta" />
      <meta property="og:locale" content="es_CL" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonical} />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Datos estructurados */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd ?? defaultJsonLd)}
      </script>
    </Helmet>
  );
};
