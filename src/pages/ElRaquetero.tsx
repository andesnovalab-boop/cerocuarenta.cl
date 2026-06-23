import React from "react";
import { motion } from "motion/react";
import { Bell, ArrowRight } from "lucide-react";
import { SEO } from "../components/SEO";

export const ElRaquetero: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      <SEO title="El Raquetero — CeroCuarenta" description="Cultura, tennis y moda desde la cancha. Muy pronto." />

      {/* ── TÍTULO EDITORIAL ── */}
      <section className="border-b border-gray-100 pt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1
              className="text-court-ink leading-[0.85] not-italic"
              style={{ fontSize: "clamp(56px, 10vw, 140px)", fontFamily: "Filena, serif", fontWeight: 700, fontStyle: "normal" }}
            >
              EL RAQUETERO
            </h1>
            <p className="text-court-ink/40 font-medium text-sm tracking-[0.25em] mt-4">
              editorial CeroCuarenta
            </p>
          </div>
          <div className="shrink-0 text-right hidden md:block">
            <p className="font-bitter italic text-[80px] text-court-olive/[0.08] leading-none select-none tracking-tighter">
              0–40
            </p>
          </div>
        </div>
      </section>

      {/* ── PRÓXIMAMENTE (creativo) ── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-8 py-24 sm:py-36 overflow-hidden">
        {/* marcador gigante de fondo */}
        <p className="pointer-events-none select-none absolute -top-10 right-0 font-bitter italic text-[clamp(140px,28vw,420px)] leading-none text-court-olive/[0.04] tracking-tighter">
          0–40
        </p>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-2xl"
        >
          <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-court-olive bg-court-olive/10 px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-court-olive animate-pulse" />
            Próximamente
          </span>

          <h2
            className="font-bitter italic text-court-ink leading-[0.95] mt-7"
            style={{ fontSize: "clamp(44px, 7vw, 92px)" }}
          >
            Estamos preparando<br />el primer saque.
          </h2>

          <p className="text-court-ink/50 text-lg leading-relaxed font-medium mt-8 max-w-xl">
            Cultura, tennis y moda desde la cancha. <span className="text-court-ink/80">El Raquetero</span> vuelve
            muy pronto con historias, drops y estilo. Las primeras entradas ya están calentando en la línea de fondo.
          </p>

          <blockquote className="border-l-2 border-court-olive pl-6 py-1 my-10">
            <p className="font-bitter italic text-2xl text-court-ink/60 leading-snug">
              "Todo gran partido empieza con un saque."
            </p>
          </blockquote>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://instagram.com/cerocuarenta.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 bg-court-ink text-white text-[11px] font-black uppercase tracking-[0.2em] px-7 py-4 rounded-full hover:bg-court-olive transition-colors"
            >
              <Bell size={14} />
              Avísame del estreno
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <span className="text-[10px] font-bold uppercase tracking-widest text-court-ink/25">
              Síguenos para no perderte el primer drop
            </span>
          </div>
        </motion.div>
      </section>
    </div>
  );
};
