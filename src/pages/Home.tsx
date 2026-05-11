import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { Product } from "../types";
import { ProductCard } from "../components/ProductCard";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Search, ArrowRight, Truck, RotateCcw, Shield } from "lucide-react";
import { SEO } from "../components/SEO";
import { toast } from "sonner";

const HERO_IMG = "/images/sesion1-028.jpg";
const LOOKBOOK_WIDE = "/images/sesion1-029.jpg";
const LOOKBOOK_TALL = "/images/sesion1-030.jpg";
const CLUB_IMG = "/images/sesion1-031.jpg";

const CATEGORIES = ["Todos", "Polera", "Poleron", "Short", "Pantalon", "Gorro", "Accesorio"];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.includes("@")) return;
    setNewsletterLoading(true);
    await supabase.from("newsletter_subscribers").upsert({ email: newsletterEmail }, { onConflict: "email" });
    toast.success("¡Suscrito! Te avisaremos de los próximos drops.");
    setNewsletterEmail("");
    setNewsletterLoading(false);
  };

  useEffect(() => { setSearchTerm(queryParam); }, [queryParam]);

  useEffect(() => {
    supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!error) setProducts((data || []) as Product[]);
        setLoading(false);
      });
  }, []);

  const featured = products.filter((p) => p.featured);
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === "Todos" || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

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
          className="absolute inset-0 w-full h-full object-cover object-center"
        >
          <source src="/cover.mp4" type="video/mp4" />
          <img
            src={HERO_IMG}
            alt="CeroCuarenta — Tennis Streetwear Santiago"
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-8 pb-20 w-full">
          <span className="inline-block text-[10px] font-bold uppercase tracking-[0.4em] text-white/70 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20 mb-6">
            Santiago, Chile · Est. 2024
          </span>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif italic tracking-tighter text-white leading-[0.9] mb-6">
            Tennis<br />Streetwear
          </h1>
          <p className="text-white/70 text-sm md:text-base tracking-widest uppercase font-medium mb-10 max-w-md">
            Inspirada en el tenis. Creada para la ciudad.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => document.getElementById("coleccion")?.scrollIntoView({ behavior: "smooth" })}
              className="bg-court-olive text-white px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white hover:text-court-olive transition-all shadow-2xl"
            >
              Ver Colección
            </button>
            <Link
              to="/galeria"
              className="bg-white/10 backdrop-blur-sm text-white border border-white/30 px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-white hover:text-court-ink transition-all"
            >
              Galería
            </Link>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ───────────────────────────────────────────── */}
      <div className="bg-court-ink text-white py-4 overflow-hidden">
        <div className="animate-marquee flex">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="text-[10px] font-bold uppercase tracking-[0.4em] mx-10 whitespace-nowrap shrink-0">
              GAME, SET AND WTF! · PRESSURE IS A PRIVILEGE · CEROCUARENTA.CL · SANTIAGO, CHILE ·
            </span>
          ))}
        </div>
      </div>

      {/* ── TRUST BADGES ──────────────────────────────────────── */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Truck, text: "Envío gratis sobre $80.000" },
            { icon: RotateCcw, text: "Cambios en 7 días" },
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
      {featured.length > 0 && !searchTerm && selectedCategory === "Todos" && (
        <section className="max-w-7xl mx-auto px-8 py-20">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-court-olive block mb-3">
                Más Vendidos
              </span>
              <h2 className="text-4xl md:text-5xl font-serif italic text-court-ink">Destacados</h2>
            </div>
            <button
              onClick={() => setSelectedCategory("Todos")}
              className="hidden md:flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-court-ink/50 hover:text-court-olive transition-colors"
            >
              Ver todo <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {featured.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── FULL COLLECTION ───────────────────────────────────── */}
      <section id="coleccion" className="max-w-7xl mx-auto px-8 py-16 border-t border-gray-100">
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-court-ink text-white"
                    : "bg-gray-100 text-court-ink/60 hover:bg-gray-200 hover:text-court-ink"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-court-ink/30" size={14} />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-[11px] font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-court-olive/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] bg-gray-200 rounded-2xl mb-4" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 border-2 border-dashed border-gray-200 rounded-3xl">
            <p className="font-serif italic text-court-ink/40 text-2xl mb-4">
              {searchTerm ? `Sin resultados para "${searchTerm}"` : "Sin productos en esta categoría."}
            </p>
            {products.length === 0 && (
              <p className="text-[11px] text-court-ink/40 font-medium mt-4">
                Próximamente nuevas piezas. ¡Suscríbete para ser el primero en enterarte!
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── LOOKBOOK PREVIEW ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-8 py-20 border-t border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-court-olive block mb-3">Editorial</span>
            <h2 className="text-4xl md:text-6xl font-serif italic leading-[0.9]">Galería<br />Drop 01</h2>
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
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* ── CLUB SECTION ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-8 py-20 border-t border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
            <img src={CLUB_IMG} alt="Club CeroCuarenta" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/70 mb-1">Próximo Evento</p>
              <p className="font-serif italic text-white text-lg">Santiago Open Session</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mt-1">Mayo 2026 · Club de Polo</p>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-court-olive block mb-5">Membresía</span>
            <h2 className="text-4xl md:text-5xl font-serif italic mb-8 leading-[1]">
              Sé parte del<br />Club CeroCuarenta
            </h2>
            <p className="text-court-ink/60 text-base leading-relaxed mb-8 font-medium">
              No es solo ropa, es una cultura. Al unirte al club accedes a drops limitados, eventos de tenis en Santiago y preventas exclusivas.
            </p>
            <ul className="space-y-4 mb-10">
              {["Acceso anticipado 24 horas antes de cada drop", "Piezas numeradas exclusivas para miembros", "Invitaciones a eventos y sesiones de tenis"].map((benefit) => (
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
              Unirse al Club <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER ────────────────────────────────────────── */}
      <section className="bg-court-olive text-white py-24 px-8 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/60 block mb-4">Newsletter</span>
        <h2 className="text-4xl md:text-6xl font-serif italic mb-6">Bienvenidos al Club</h2>
        <p className="text-white/70 max-w-lg mx-auto mb-12 text-base leading-relaxed font-medium">
          Suscríbete para recibir notificaciones de drops, eventos y descuentos exclusivos para miembros.
        </p>
        <form onSubmit={handleNewsletter} className="flex max-w-md mx-auto bg-white/10 border border-white/20 rounded-full overflow-hidden focus-within:bg-white/20 transition-all">
          <input
            type="email"
            required
            placeholder="tu@email.com"
            value={newsletterEmail}
            onChange={(e) => setNewsletterEmail(e.target.value)}
            className="flex-grow bg-transparent px-6 py-4 text-[11px] font-bold uppercase tracking-widest outline-none placeholder:text-white/30 text-white"
          />
          <button
            type="submit"
            disabled={newsletterLoading}
            className="bg-white text-court-olive px-8 py-4 font-bold text-[11px] uppercase tracking-widest hover:bg-court-ink hover:text-white transition-all rounded-full m-1 disabled:opacity-60"
          >
            {newsletterLoading ? "..." : "Suscribir"}
          </button>
        </form>
      </section>
    </div>
  );
};
