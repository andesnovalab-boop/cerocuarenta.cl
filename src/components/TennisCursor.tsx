import { useEffect, useRef, useState } from "react";

export function TennisCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);
  const [visible, setVisible] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };
    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);
    const onLeave = () => setVisible(false);
    const onEnter = () => setVisible(true);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    const animate = () => {
      if (ref.current) {
        ref.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      }
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf.current);
    };
  }, [visible]);

  if (typeof window === "undefined") return null;

  return (
    <div
      ref={ref}
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
      <div style={{
        width: clicking ? 22 : 24,
        height: clicking ? 22 : 24,
        marginLeft: -2,
        marginTop: -2,
        transition: "width 0.12s, height 0.12s",
      }}>
        {/* Pelota como puntero. La punta está a la derecha; scaleX(-1) la voltea
            para que apunte a la izquierda, como un cursor normal. */}
        <img src="/pelota-de-tenis.png" alt=""
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", transform: "scaleX(-1)" }} />
      </div>
    </div>
  );
}
