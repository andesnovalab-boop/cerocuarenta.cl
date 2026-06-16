import React from "react";
import { SEO } from "../components/SEO";

export const Club: React.FC = () => {
  return (
    <div className="bg-white min-h-screen">
      <SEO
        title="El Club"
        description="CeroCuarenta no es solo una marca; es una forma de entender el juego, dentro y fuera de la cancha."
      />

      {/* ── TÍTULO ─────────────────────────────────────────────── */}
      <header className="max-w-6xl mx-auto px-4 sm:px-8 pt-14 sm:pt-20 pb-10 sm:pb-16">
        <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-court-olive block mb-4">
          Manifiesto
        </span>
        <h1 className="font-bitter italic text-[clamp(36px,6vw,72px)] text-court-ink leading-tight tracking-tight">
          El Club
        </h1>
      </header>

      {/* ── CONTENEDOR EDITORIAL ───────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pb-16 sm:pb-32 flex flex-col gap-16 sm:gap-24 md:gap-32">

        {/* ── FILA 1: Texto izquierda · Imagen DERECHA ── */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-12 md:gap-20 items-start">
          <div className="flex flex-col gap-7">
            <p className="text-[15px] text-court-ink/80 leading-[1.9] font-sans font-normal">
              CeroCuarenta no es solo una marca; es una forma de entender el juego, dentro y fuera de la cancha.
            </p>
            <p className="text-[15px] text-court-ink/80 leading-[1.9] font-sans font-normal">
              Nace desde la cultura del tenis, pero no se queda en lo deportivo. Toma sus códigos, su estética limpia, su disciplina silenciosa y los traduce en prendas urbanas y minimalistas: poleras que no buscan gritar, sino representar. Cada pieza está pensada para quienes reconocen en el tenis algo más que un deporte: una comunidad, una identidad, una manera de habitar el mundo.
            </p>
          </div>
          <div className="aspect-[16/10] overflow-hidden rounded-xl">
            <img src="/images/algarrobo-14.jpg" alt="CeroCuarenta en la cancha" loading="lazy" className="w-full h-full object-cover grayscale" />
          </div>
        </div>

        {/* ── FILA 2: Imagen IZQUIERDA · Texto derecha ── */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr] gap-12 md:gap-20 items-start">
          <div className="aspect-[16/10] overflow-hidden rounded-xl order-first">
            <img src="/images/algarrobo-9.jpg" alt="Comunidad CeroCuarenta" loading="lazy" className="w-full h-full object-cover grayscale" />
          </div>
          <div className="flex flex-col gap-7">
            <p className="text-[15px] text-court-ink/80 leading-[1.9] font-sans font-normal">
              CeroCuarenta es, probablemente, uno de los momentos más incómodos y decisivos del tenis. Estar 0–40 abajo no es solo estar al borde de perder un punto: es estar frente a un límite.
            </p>
            <p className="text-[15px] text-court-ink/80 leading-[1.9] font-sans font-normal">
              Es el instante donde la presión deja de ser externa y se vuelve interna. Donde ya no basta con jugar bien: hay que sostenerse, resistir, creer. Es un punto de quiebre.
            </p>
            <p className="text-[15px] text-court-ink/80 leading-[1.9] font-sans font-normal">
              Elegimos ese momento porque ahí aparece lo esencial. La resiliencia de no rendirse. La determinación de seguir cumpliendo cuando todo parece en contra. La capacidad de remontar, incluso cuando las probabilidades no acompañan.
            </p>
          </div>
        </div>

        {/* ── FILA 3: Texto izquierda · Imagen DERECHA ── */}
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-12 md:gap-20 items-start">
          <div className="flex flex-col gap-7">
            <p className="text-[15px] text-court-ink/80 leading-[1.9] font-sans font-normal">
              El tenis nace en la cancha, pero no debería quedarse ahí. Es disciplina, aprendizaje, carácter y también infancia: partidos improvisados, pelotas gastadas y risas con amigos.
            </p>
            <p className="text-[15px] text-court-ink/80 leading-[1.9] font-sans font-normal">
              Así nace CeroCuarenta. Desde lo simple, pero con la convicción intacta. Con la resiliencia de levantar un sueño que viene de lejos: de una infancia marcada por partidos memorables, por tardes interminables jugando sin red, sin reglas estrictas, pero con todo el corazón.
            </p>
            <p className="font-bitter italic text-[17px] text-court-ink/50 leading-relaxed">
              Porque muchas veces, el rival más difícil no está al otro lado de la red. Está dentro de uno mismo.
            </p>
          </div>
          <div className="aspect-[16/10] overflow-hidden rounded-xl">
            <img src="/images/sesion1-062.jpg" alt="Orígenes CeroCuarenta" loading="lazy" className="w-full h-full object-cover grayscale" />
          </div>
        </div>
      </main>


    </div>
  );
};
