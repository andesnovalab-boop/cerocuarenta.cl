import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BlogPost, BlogCategory } from "../types";
import { supabase } from "../supabase";
import { ArrowRight, Clock } from "lucide-react";
import { motion } from "motion/react";
import { SEO } from "../components/SEO";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const CATEGORIES: BlogCategory[] = ["Cultura", "Tennis", "Moda", "Drops", "Noticias"];

const CAT_COLORS: Record<string, string> = {
  Cultura:  "bg-court-olive/10 text-court-olive",
  Tennis:   "bg-court-ink/10 text-court-ink",
  Moda:     "bg-rose-50 text-rose-600",
  Drops:    "bg-amber-50 text-amber-700",
  Noticias: "bg-blue-50 text-blue-600",
};

function CategoryPill({ cat }: { cat: string }) {
  return (
    <span className={`text-[9px] font-black uppercase tracking-[0.25em] px-3 py-1 rounded-full ${CAT_COLORS[cat] ?? "bg-gray-100 text-gray-600"}`}>
      {cat}
    </span>
  );
}

function ArticleCard({ post, idx }: { post: BlogPost; idx: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: idx * 0.08 }}
    >
      <Link to={`/raquetero/${post.slug}`} className="group flex flex-col h-full">
        <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-5 bg-court-cream">
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { (e.currentTarget as HTMLImageElement).src = "/images/sesion1-038.jpg"; }}
          />
        </div>
        <CategoryPill cat={post.category} />
        <h3 className="font-bitter italic text-2xl text-court-ink leading-tight mt-3 mb-2 group-hover:text-court-olive transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-court-ink/40 text-xs leading-relaxed flex-1 line-clamp-2 font-medium">
          {post.excerpt}
        </p>
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 text-[9px] font-bold uppercase tracking-widest text-court-ink/25">
          <Clock size={11} />
          {format(new Date(post.created_at), "d MMM yyyy", { locale: es })}
          <span className="ml-auto text-court-olive flex items-center gap-1 group-hover:gap-2 transition-all">
            Leer <ArrowRight size={11} />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export const ElRaquetero: React.FC = () => {
  const [filter, setFilter] = useState<string>("all");
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => setAllPosts((data || []) as BlogPost[]));
  }, []);

  const filtered = filter === "all" ? allPosts : allPosts.filter(p => p.category === filter);

  return (
    <div className="bg-white min-h-screen">
      <SEO title="El Raquetero — CeroCuarenta" description="Cultura, tennis y moda desde la cancha." />

      {/* ══════════════════════════════════════════════════════════
          TÍTULO EDITORIAL
      ══════════════════════════════════════════════════════════ */}
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

      {/* ══════════════════════════════════════════════════════════
          ARTÍCULO DESTACADO FIJO — AGASSI (dos columnas)
      ══════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16 border-b border-gray-100">

        {/* ── COVER PHOTO SUPERIOR ── */}
        <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden mb-14 shadow-xl shadow-black/10">
          <img
            src="/images/agassi-cover.png"
            alt="Agassi cover"
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/50 mb-1">Destacado · Tennis · Moda</p>
              <p className="font-bitter italic text-white text-3xl md:text-4xl leading-tight">
                Talento, carisma<br />y estilo
              </p>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">N°01</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* ── COLUMNA IZQUIERDA: Texto ── */}
          <div>
            <CategoryPill cat="Tennis" />

            <h2
              className="font-bitter italic text-court-ink leading-[1.05] mt-5 mb-8"
              style={{ fontSize: "clamp(28px, 3.5vw, 46px)" }}
            >
              Talento, carisma y estilo: El tenis lifestyle de Agassi
            </h2>

            {/* Letra capital decorativa */}
            <div className="text-base text-court-ink/70 leading-relaxed font-medium mb-6">
              <span className="float-left font-bitter italic text-[72px] leading-[0.75] mr-3 mt-1 text-court-olive">
                E
              </span>
              l estilo de André Agassi en sus años jóvenes rompió por completo con la tradición del tenis clásico. Mientras predominaban los looks blancos y sobrios, él apareció en la cancha con colores neón, estampados llamativos, shorts de mezclilla y chaquetas vibrantes que parecían más propias del pop art que de Wimbledon. Su melena larga, cintillos icónicos y una actitud rebelde terminaron de construir una imagen que desafiaba las normas de un deporte históricamente conservador.
            </div>

            <p className="text-base text-court-ink/70 leading-relaxed font-medium mb-10 clear-left">
              Más que una simple elección estética, su forma de vestir era una declaración de identidad. Agassi convirtió la cancha en una pasarela donde mezclaba deporte, cultura pop y personalidad, marcando una era en la que el tenis empezó a abrirse a nuevas expresiones. Su estilo no solo lo hizo reconocible en segundos, sino que también influyó en generaciones posteriores, demostrando que el rendimiento y la autenticidad podían convivir sin pedir permiso.
            </p>

            {/* Cita destacada */}
            <blockquote className="border-l-2 border-court-olive pl-6 py-1 my-8">
              <p className="font-bitter italic text-xl text-court-ink/60 leading-snug">
                "Image is everything."
              </p>
              <cite className="text-[10px] font-bold uppercase tracking-widest text-court-ink/30 mt-2 block not-italic">
                — André Agassi · Canon, 1990
              </cite>
            </blockquote>

            <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-court-ink/25">
                <Clock size={12} />
                Mayo 2024
              </div>
              <span className="text-court-ink/20">·</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-court-ink/25">
                Por CeroCuarenta
              </span>
            </div>
          </div>

          {/* ── COLUMNA DERECHA: Imagen ilustración ── */}
          <div className="flex flex-col gap-4">
            {/* Imagen principal — estética retro con filtro */}
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shadow-xl shadow-black/10">
              <img
                src="/images/agassi-hero.png"
                alt="Agassi hero"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
              {/* Overlay editorial */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              {/* Etiqueta de imagen */}
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/60">
                  Inspiración visual · Drop 01
                </p>
              </div>
              {/* Marco decorativo */}
              <div className="absolute top-4 right-4 border border-white/20 rounded-lg px-3 py-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Retro</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FILTROS + LISTADO DINÁMICO desde Supabase / Blog
      ══════════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 border-b border-gray-100 overflow-x-auto">
        <div className="flex gap-8 min-w-max">
          {["all", ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`text-[10px] font-black uppercase tracking-[0.25em] pb-1 border-b-2 transition-all ${
                filter === cat
                  ? "border-court-olive text-court-olive"
                  : "border-transparent text-court-ink/30 hover:text-court-ink"
              }`}
            >
              {cat === "all" ? "Todos" : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        {filtered.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-court-olive/10 rounded-[2rem]">
            <p className="font-bitter italic text-3xl text-court-ink/30 mb-3">Próximamente.</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-court-ink/20">
              Los primeros artículos están en camino.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {filtered.map((post, i) => (
              <React.Fragment key={post.id}>
                <ArticleCard post={post} idx={i} />
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
