import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Product } from "../types";
import { ProductCard } from "../components/ProductCard";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Truck, Shield } from "lucide-react";
import { SEO } from "../components/SEO";

const HERO_IMG = "/images/hero-poster.jpg";
const LOOKBOOK_WIDE = "/images/sesion1-029.jpg";
const LOOKBOOK_TALL = "/images/sesion1-030.jpg";
const CLUB_IMG = "/images/sesion1-031.jpg";


export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setProducts((data || []) as Product[]);
        setLoading(false);
      });
  }, []);


  return (
    <div className="bg-white">
      <SEO />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative h-[90vh] min-h-[600px] flex flex-col justify-end overflow-hidden">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={HERO_IMG}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover object-center"
        >
          <source src="/cover.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Logo centrado transparente */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <img
            src="/images/logo_blanco.png"
            alt="CeroCuarenta"
            className="w-40 sm:w-56 md:w-72 lg:w-96 opacity-40 select-none"
            draggable={false}
          />
        </div>

        <div className="relative z-10 w-full flex justify-center pb-16">
          <button
            onClick={() => document.getElementById("coleccion")?.scrollIntoView({ behavior: "smooth" })}
            className="bg-white/10 backdrop-blur-sm text-white border border-white/40 px-6 sm:px-12 py-4 rounded-full font-bold uppercase tracking-widest text-[11px] hover:bg-white hover:text-court-ink transition-all shadow-xl"
          >
            Ver Colección
          </button>
        </div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────────────── */}
      <div className="bg-court-ink text-white py-4 overflow-hidden">
        <div className="animate-marquee flex">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="text-[10px] font-bold uppercase tracking-[0.4em] mx-10 whitespace-nowrap shrink-0">
              INSPIRADA EN EL TENIS, CREADA PARA TI ·
            </span>
          ))}
        </div>
      </div>

      {/* ── TRUST BADGES ──────────────────────────────────────── */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col md:flex-row justify-center gap-4 md:gap-8">
          {[
            { icon: Truck, text: "Envíos a todo Chile" },
            { icon: Shield, text: "Pago 100% seguro con MercadoPago" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center justify-center gap-3 py-2">
              <Icon size={16} className="text-court-olive shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-court-ink/60">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── DESTACADOS ────────────────────────────────────────── */}
      {/* ── FULL COLLECTION ───────────────────────────────────── */}
      <section id="coleccion" className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[13px] font-bold uppercase tracking-[0.4em] text-court-olive block mb-3">Drop 01</span>
            <h2 className="text-[28px] md:text-[44px] font-bitter italic text-court-ink">Colección</h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 md:gap-10">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-2xl mb-4" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-6 md:gap-10">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 border-2 border-dashed border-gray-200 rounded-3xl">
            <p className="font-bitter italic text-court-ink/40 text-2xl mb-4">Próximamente nuevas piezas.</p>
          </div>
        )}
      </section>

      {/* ── LOOKBOOK PREVIEW ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-20 border-t border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-court-olive block mb-3">Editorial</span>
            <h2 className="text-4xl md:text-6xl font-bitter italic leading-[0.9]">Galería<br />Drop 01</h2>
          </div>
          <Link
            to="/galeria"
            className="group flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest text-court-ink hover:text-court-olive transition-all"
          >
            Explorar
            <span className="w-10 h-10 rounded-full border border-court-ink/20 flex items-center justify-center group-hover:border-court-olive group-hover:bg-court-olive group-hover:text-white transition-all">
              <ArrowRight size={16} />
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          <div
            className="md:col-span-8 aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => navigate("/galeria")}
          >
            <img
              src={LOOKBOOK_WIDE}
              alt="Galería CeroCuarenta"
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
          <div
            className="md:col-span-4 aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => navigate("/galeria")}
          >
            <img
              src={LOOKBOOK_TALL}
              alt="Galería CeroCuarenta 2"
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* ── CLUB SECTION ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-20 border-t border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
            <img src={CLUB_IMG} alt="Club CeroCuarenta" loading="lazy" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-court-olive block mb-5">Manifiesto</span>
            <h2 className="text-4xl md:text-5xl font-bitter italic mb-8 leading-[1]">
              El Club<br />CeroCuarenta
            </h2>
            <p className="text-court-ink/60 text-base leading-relaxed mb-8 font-medium">
              No es solo ropa, es una cultura. Una comunidad que comparte la cancha, la identidad y el estilo de quienes entienden el tenis como algo más que un deporte.
            </p>
            <ul className="space-y-4 mb-10">
              {["Drops exclusivos con piezas limitadas", "Piezas numeradas de colección", "Eventos y sesiones de tenis en Santiago"].map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-court-olive shrink-0" />
                  <span className="text-[13px] text-court-ink/70 font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/club"
              className="inline-flex items-center gap-3 bg-court-ink text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-court-olive transition-all shadow-xl"
            >
              Conocer el Club <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
