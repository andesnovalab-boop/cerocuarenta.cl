import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { SEO } from "../components/SEO";
import { Lightbox } from "../components/Lightbox";

const PHOTOS = [
  "/images/sesion1-039.jpg", "/images/sesion1-040.jpg", "/images/sesion1-041.jpg",
  "/images/sesion1-042.jpg", "/images/sesion1-043.jpg", "/images/sesion1-044.jpg",
  "/images/sesion1-045.jpg", "/images/sesion1-046.jpg", "/images/sesion1-047.jpg",
  "/images/sesion1-048.jpg", "/images/sesion1-049.jpg", "/images/sesion1-050.jpg",
  "/images/sesion1-051.jpg", "/images/sesion1-052.jpg", "/images/sesion1-053.jpg",
  "/images/sesion1-054.jpg", "/images/sesion1-055.jpg", "/images/sesion1-056.jpg",
  "/images/algarrobo-11.jpg", "/images/algarrobo-12.jpg", "/images/algarrobo-13.jpg",
  "/images/algarrobo-14.jpg", "/images/algarrobo-15.jpg", "/images/algarrobo-16.jpg",
];

const LIGHTBOX_PHOTOS = PHOTOS.map((src, i) => ({
  src,
  title: `Foto ${String(i + 1).padStart(2, "0")}`,
  subtitle: "CeroCuarenta · 2024",
}));

export const Lookbook: React.FC = () => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <div className="bg-white min-h-screen">
      <SEO title="Galería" description="Galería editorial Drop 01 — CeroCuarenta Santiago" />

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-court-olive block mb-4">
              Editorial · Santiago, Chile · 2024
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-bitter italic tracking-tighter text-court-ink leading-none">
              Galería<br />Drop 01
            </h1>
          </div>
          <div className="max-w-sm">
            <p className="text-court-ink/50 text-base leading-relaxed font-medium mb-4">
              Una exploración visual de nuestra primera colección. Sesiones en Algarrobo y Santiago, capturando la esencia del tenis en el paisaje chileno.
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-court-ink/30">
              {PHOTOS.length} fotografías · Haz clic para ampliar
            </p>
          </div>
        </div>
      </div>

      {/* ── MARQUEE ─────────────────────────────────────────────── */}
      <div className="bg-court-ink text-white py-5 overflow-hidden">
        <div className="animate-marquee flex">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="text-[10px] font-bold uppercase tracking-[0.4em] mx-10 whitespace-nowrap shrink-0">
              INSPIRADA EN EL TENIS, CREADA PARA TI ·
            </span>
          ))}
        </div>
      </div>

      {/* ── GRID MASONRY ────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
          {PHOTOS.map((src, i) => (
            <div key={i} className="break-inside-avoid mb-3">
              <button
                onClick={() => setLightboxIndex(i)}
                className="group relative w-full overflow-hidden rounded-xl block focus:outline-none focus-visible:ring-2 focus-visible:ring-court-olive"
              >
                <img
                  src={src}
                  alt={`Foto ${i + 1}`}
                  loading="lazy"
                  decoding="async"
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUOTE ───────────────────────────────────────────────── */}
      <section className="border-t border-gray-100 py-16 sm:py-24 px-4 sm:px-8 text-center">
        <blockquote className="font-bitter italic text-3xl md:text-5xl text-court-ink/30 max-w-3xl mx-auto leading-tight mb-10">
          "Capturando la esencia del tenis en el paisaje de Chile."
        </blockquote>
        <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-[10px] font-bold uppercase tracking-[0.3em] text-court-ink/20">
          <span>Fotografía: Court Studio</span>
          <span>Locación: Algarrobo</span>
          <span>Temporada: 2024</span>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="bg-court-olive text-white py-16 sm:py-20 px-4 sm:px-8 text-center">
        <h2 className="text-4xl md:text-6xl font-bitter italic mb-6">¿Te gustó lo que viste?</h2>
        <p className="text-white/70 max-w-md mx-auto mb-10 font-medium">
          Cada pieza de esta sesión está disponible en nuestra colección.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-3 bg-white text-court-olive px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-court-ink hover:text-white transition-all"
        >
          Ver Colección <ArrowRight size={16} />
        </Link>
      </section>

      {/* ── LIGHTBOX ────────────────────────────────────────────── */}
      <Lightbox
        photos={LIGHTBOX_PHOTOS}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
    </div>
  );
};
