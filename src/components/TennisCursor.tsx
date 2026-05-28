import { useEffect, useRef, useState } from "react";

export function TennisCursor() {
  const ballRef  = useRef<HTMLDivElement>(null);
  const pos      = useRef({ x: 0, y: 0 });
  const raf      = useRef<number>(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible,  setVisible]  = useState(false);
  const [clicking, setClicking] = useState(false);
  const [idle,     setIdle]     = useState(false);

  useEffect(() => {
    const resetIdle = () => {
      setIdle(false);
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => setIdle(true), 3000);
    };

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
      resetIdle();
    };
    const onDown = () => { setClicking(true); resetIdle(); };
    const onUp   = () => setClicking(false);
    const onLeave = () => { setVisible(false); setIdle(false); if (idleTimer.current) clearTimeout(idleTimer.current); };
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup",   onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    const animate = () => {
      if (ballRef.current) {
        ballRef.current.style.transform =
          `translate(${pos.current.x}px, ${pos.current.y}px)`;
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup",   onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [visible]);

  if (typeof window === "undefined") return null;

  return (
    <div
      ref={ballRef}
      style={{
        position: "fixed",
        top: 0, left: 0,
        pointerEvents: "none",
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s",
        willChange: "transform",
      }}
    >
      {/* Div interno: maneja tamaño + bounce sin interferir con el translate del padre */}
      <div style={{
        width: clicking ? 30 : 32,
        height: clicking ? 30 : 32,
        marginLeft: clicking ? -15 : -16,
        marginTop:  clicking ? -15 : -16,
        transition: "width 0.12s, height 0.12s, margin 0.12s",
        animation: idle ? "tennisBounce 0.7s ease-in-out infinite" : "none",
        transformOrigin: "bottom center",
      }}>
        <img src="/pelota-de-tenis.png" alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      </div>
    </div>
  );
}
