import React, { useState } from "react";
import { motion } from "motion/react";
import { Trophy, Star, Users, Calendar, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Lightbox } from "../components/Lightbox";
import { SEO } from "../components/SEO";
import { supabase } from "../supabase";
import { toast } from "sonner";

const GALLERY_PHOTOS = [
  { src: "/images/sesion1-032.jpg",  title: "Estilo Libre",   subtitle: "CeroCuarenta · 2024" },
  { src: "/images/sesion1-033.jpg",  title: "En la Cancha",   subtitle: "CeroCuarenta · 2024" },
  { src: "/images/sesion1-034.jpg",  title: "Movimiento",     subtitle: "CeroCuarenta · 2024" },
  { src: "/images/sesion1-035.jpg",  title: "Drop 02",        subtitle: "CeroCuarenta · 2024" },
  { src: "/images/sesion1-036.jpg",  title: "Algarrobo V",    subtitle: "CeroCuarenta · 2024" },
  { src: "/images/sesion1-037.jpg",  title: "Club Session",   subtitle: "CeroCuarenta · 2024" },
];

const benefits = [
  {
    icon: <Star size={28} />,
    title: "Acceso Anticipado",
    description: "Sé el primero en comprar nuestros drops exclusivos, 24h antes que el público general.",
  },
  {
    icon: <Users size={28} />,
    title: "Eventos Exclusivos",
    description: "Invitaciones a torneos, clínicas de tenis y noches privadas del club en Santiago.",
  },
  {
    icon: <Trophy size={28} />,
    title: "Recompensas",
    description: "Acumula puntos con cada compra y canjéalos por productos o experiencias únicas.",
  },
  {
    icon: <Calendar size={28} />,
    title: "Drops Limitados",
    description: "Piezas numeradas y colaboraciones especiales, solo disponibles para miembros.",
  },
];

export const Club: React.FC = () => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [dropEmail, setDropEmail] = useState("");
  const [ctaEmail, setCtaEmail] = useState("");
  const [loadingDrop, setLoadingDrop] = useState(false);
  const [loadingCta, setLoadingCta] = useState(false);

  const handleSubscribe = async (email: string, setEmail: (v: string) => void, setLoading: (v: boolean) => void) => {
    if (!email.includes("@")) { toast.error("Ingresa un email válido"); return; }
    setLoading(true);
    await supabase.from("newsletter_subscribers").upsert({ email }, { onConflict: "email" });
    toast.success("¡Suscrito! Te avisaremos antes del próximo drop.");
    setEmail("");
    setLoading(false);
  };

  return (
    <div className="bg-white min-h-screen">
      <SEO title="El Club" description="Únete al Club CeroCuarenta — acceso anticipado, eventos exclusivos y drops limitados." />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative h-[70vh] min-h-[500px] flex items-end overflow-hidden">
        <img
          src="/images/algarrobo-9.jpg"
          alt="Club CeroCuarenta"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-8 pb-16 w-full">
          <span className="inline-block text-[10px] font-bold uppercase tracking-[0.5em] text-white/60 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20 mb-5">
            Membresía
          </span>
          <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter text-white leading-none mb-4">
            El Club
          </h1>
          <p className="text-white/60 text-base md:text-lg font-medium max-w-md">
            Más que una marca, una comunidad unida por la pasión por el tenis y el estilo.
          </p>
        </div>
      </section>

      {/* ── BENEFICIOS ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-court-olive block mb-3">
            Beneficios
          </span>
          <h2 className="text-4xl md:text-5xl font-serif italic">¿Qué obtienes?</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-gray-50 rounded-2xl p-8 flex flex-col items-start gap-4 hover:bg-court-olive/5 transition-colors"
            >
              <div className="p-3 bg-court-olive/10 rounded-xl text-court-olive">
                {b.icon}
              </div>
              <h3 className="text-xl font-bold text-court-ink not-italic tracking-tight">{b.title}</h3>
              <p className="text-court-ink/50 text-sm leading-relaxed font-medium">{b.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── GALERÍA MASONRY STRIP ────────────────────────────────── */}
      <section className="border-t border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-8 mb-10">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-court-olive block mb-2">Galería</span>
              <h2 className="text-3xl md:text-4xl font-serif italic">La Comunidad</h2>
            </div>
            <Link
              to="/galeria"
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-court-ink/40 hover:text-court-olive transition-colors"
            >
              Ver galería <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Grid de fotos con click → lightbox */}
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {GALLERY_PHOTOS.map((photo, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                onClick={() => setLightboxIndex(i)}
                className={`group overflow-hidden rounded-xl relative focus:outline-none focus-visible:ring-2 focus-visible:ring-court-olive ${
                  i === 0 || i === 3 ? "aspect-[3/4]" : "aspect-square"
                }`}
              >
                <img
                  src={photo.src}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end p-3">
                  <span className="text-white/0 group-hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors">
                    {photo.title}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ── EVENTO PRÓXIMO ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-8 py-16 border-t border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <img
              src="/images/algarrobo-17.jpg"
              alt="Próximo evento"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/60 block mb-1">
                Próximo evento
              </span>
              <p className="text-white font-serif italic text-2xl">Santiago Open Session</p>
              <p className="text-white/50 text-[11px] font-bold uppercase tracking-widest mt-1">
                Mayo 2026 · Club de Polo Santiago
              </p>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-court-olive block mb-4">
              Próximo Drop
            </span>
            <h2 className="text-4xl md:text-5xl font-serif italic mb-6 leading-none">
              Sé el primero<br />en enterarte
            </h2>
            <p className="text-court-ink/50 text-base leading-relaxed mb-8 font-medium">
              Los miembros del club reciben notificación exclusiva 24 horas antes del lanzamiento de cada drop. Cupos limitados.
            </p>
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="tu@email.com"
                value={dropEmail}
                onChange={(e) => setDropEmail(e.target.value)}
                className="flex-1 bg-gray-100 border border-gray-200 px-5 py-3.5 rounded-xl text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-court-olive/20 focus:border-court-olive transition-all"
              />
              <button
                onClick={() => handleSubscribe(dropEmail, setDropEmail, setLoadingDrop)}
                disabled={loadingDrop}
                className="bg-court-ink text-white px-6 py-3.5 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-court-olive transition-all whitespace-nowrap disabled:opacity-60"
              >
                {loadingDrop ? "..." : "Unirse"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────── */}
      <section className="bg-court-ink text-white py-24 px-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-court-olive/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-5xl md:text-7xl font-serif italic mb-6">¿Listo para unirte?</h2>
          <p className="text-white/50 text-base mb-10 max-w-md mx-auto font-medium">
            Únete a la lista de espera para el próximo drop y recibe beneficios inmediatos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="tu@email.com"
              value={ctaEmail}
              onChange={(e) => setCtaEmail(e.target.value)}
              className="flex-1 bg-white/10 border border-white/20 px-6 py-4 rounded-full text-[12px] font-bold uppercase tracking-widest focus:outline-none focus:border-white transition-all placeholder:text-white/30 text-white"
            />
            <button
              onClick={() => handleSubscribe(ctaEmail, setCtaEmail, setLoadingCta)}
              disabled={loadingCta}
              className="bg-white text-court-ink px-8 py-4 rounded-full font-bold uppercase tracking-widest text-[12px] hover:bg-court-olive hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loadingCta ? "..." : <><span>Unirse</span> <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      </section>

      {/* ── LIGHTBOX ─────────────────────────────────────────────── */}
      <Lightbox
        photos={GALLERY_PHOTOS}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChange={setLightboxIndex}
      />
    </div>
  );
};
