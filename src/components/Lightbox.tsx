import React, { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LightboxPhoto {
  src: string;
  title?: string;
  subtitle?: string;
}

interface LightboxProps {
  photos: LightboxPhoto[];
  index: number | null;
  onClose: () => void;
  onChange: (index: number) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ photos, index, onClose, onChange }) => {
  const isOpen = index !== null;

  const prev = useCallback(() => {
    if (index === null) return;
    onChange(index === 0 ? photos.length - 1 : index - 1);
  }, [index, photos.length, onChange]);

  const next = useCallback(() => {
    if (index === null) return;
    onChange(index === photos.length - 1 ? 0 : index + 1);
  }, [index, photos.length, onChange]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, prev, next, onClose]);

  const photo = index !== null ? photos[index] : null;

  return (
    <AnimatePresence>
      {isOpen && photo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
          onClick={onClose}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors z-10 p-2"
          >
            <X size={28} />
          </button>

          {/* Counter */}
          <div className="absolute top-6 left-6 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
            {(index! + 1).toString().padStart(2, "0")} / {photos.length.toString().padStart(2, "0")}
          </div>

          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 md:left-8 text-white/40 hover:text-white transition-colors z-10 p-3 rounded-full hover:bg-white/10"
          >
            <ChevronLeft size={32} />
          </button>

          {/* Image */}
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-3xl w-full mx-16 md:mx-24"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photo.src}
              alt={photo.title || ""}
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
              draggable={false}
            />

            {(photo.title || photo.subtitle) && (
              <div className="mt-6 text-center">
                {photo.title && (
                  <p className="text-white font-serif italic text-2xl">{photo.title}</p>
                )}
                {photo.subtitle && (
                  <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mt-1">{photo.subtitle}</p>
                )}
              </div>
            )}
          </motion.div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 md:right-8 text-white/40 hover:text-white transition-colors z-10 p-3 rounded-full hover:bg-white/10"
          >
            <ChevronRight size={32} />
          </button>

          {/* Thumbnail strip */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] px-4 scrollbar-hide">
            {photos.map((p, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); onChange(i); }}
                className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden transition-all ${
                  i === index ? "ring-2 ring-white opacity-100" : "opacity-30 hover:opacity-60"
                }`}
              >
                <img src={p.src} alt="" className="w-full h-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
