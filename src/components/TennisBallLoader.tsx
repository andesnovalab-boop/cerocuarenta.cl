import { useEffect, useState } from "react";

const rng = (seed: number) => {
  let s = seed * 9301 + 49297;
  return ((s % 233280) / 233280);
};

const BALLS = Array.from({ length: 120 }, (_, i) => ({
  id:       i,
  left:     2  + rng(i * 7  + 1) * 96,          // 2–98% — cubre todo el ancho
  size:     16 + rng(i * 13 + 2) * 36,           // 16–52px
  duration: 0.6 + rng(i * 17 + 3) * 2.4,        // 0.6–3.0s — velocidades muy variadas
  delay:    rng(i * 11 + 4) * 3.5,              // 0–3.5s — arranques muy escalonados
  spin:     (rng(i * 5 + 5) > 0.5 ? 1 : -1)    // dirección aleatoria
            * (120 + rng(i * 23 + 6) * 600),    // 120–720deg — giro variable
  drift:    (rng(i * 19 + 7) - 0.5) * 80,       // -40 a +40px de desvío horizontal
  blur:     rng(i * 3 + 8) < 0.22,              // ~22% borrosas (profundidad)
  opacity:  0.4 + rng(i * 31 + 9) * 0.55,      // 0.4–0.95 — variación tonal
}));

export function TennisBallLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const minShow = setTimeout(() => {
      const onLoad = () => {
        setFadeOut(true);
        setTimeout(() => setVisible(false), 600);
      };
      if (document.readyState === "complete") {
        onLoad();
      } else {
        window.addEventListener("load", onLoad, { once: true });
      }
    }, 2000);

    return () => clearTimeout(minShow);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        backgroundColor: "#FDFDFD",
        overflow: "hidden",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.6s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Logo centrado */}
      <div style={{
        position: "relative",
        zIndex: 2,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
        animation: "loaderPulse 1.8s ease-in-out infinite",
      }}>
        <img src="/images/logo.png" alt="Cero Cuarenta"
          style={{ width: 120, opacity: 0.85 }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <span style={{
          fontFamily: "var(--font-filena, serif)",
          fontSize: "0.6rem",
          letterSpacing: "0.45em",
          textTransform: "uppercase",
          color: "#5A5A40",
          opacity: 0.7,
        }}>
          Cargando
        </span>
      </div>

      {/* Lluvia de pelotas */}
      {BALLS.map(b => (
        <img
          key={b.id}
          src="/pelota-de-tenis.png"
          alt=""
          style={{
            position: "absolute",
            top: `-${b.size + 10}px`,
            left: `${b.left}%`,
            width:  b.size,
            height: b.size,
            opacity: b.blur ? b.opacity * 0.5 : b.opacity,
            filter: b.blur ? "blur(1.8px)" : "none",
            animationName: `ballFall${b.id}`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            animationTimingFunction: "ease-in",
            animationIterationCount: "infinite",
            zIndex: 1,
          }}
        />
      ))}

      <style>{`
        ${BALLS.map(b => `
          @keyframes ballFall${b.id} {
            0%   { transform: translateY(0px)     translateX(0px)          rotate(0deg); }
            100% { transform: translateY(110vh)   translateX(${b.drift}px) rotate(${b.spin}deg); }
          }
        `).join("")}
        @keyframes loaderPulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
