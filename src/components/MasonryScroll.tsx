import React from "react";

interface MasonryScrollProps {
  onPhotoClick: (index: number) => void;
  height?: number;
}

const COLUMNS: { src: string; h: number; idx: number }[][] = [
  [
    { src: "/images/sesion1-001.jpg", h: 320, idx: 0 },
    { src: "/images/sesion1-002.jpg", h: 240, idx: 1 },
  ],
  [
    { src: "/images/algarrobo-0.jpg", h: 280, idx: 2 },
    { src: "/images/algarrobo-1.jpg", h: 280, idx: 3 },
  ],
  [
    { src: "/images/sesion1-003.jpg", h: 200, idx: 4 },
    { src: "/images/sesion1-004.jpg", h: 360, idx: 5 },
  ],
  [
    { src: "/images/algarrobo-2.jpg", h: 182, idx: 6 },
    { src: "/images/algarrobo-3.jpg", h: 198, idx: 7 },
    { src: "/images/algarrobo-4.jpg", h: 172, idx: 8 },
  ],
  [
    { src: "/images/sesion1-005.jpg", h: 280, idx: 9 },
    { src: "/images/sesion1-006.jpg", h: 280, idx: 10 },
  ],
  [
    { src: "/images/algarrobo-5.jpg", h: 320, idx: 11 },
    { src: "/images/algarrobo-6.jpg", h: 240, idx: 12 },
  ],
  [
    { src: "/images/sesion1-007.jpg", h: 200, idx: 13 },
    { src: "/images/sesion1-008.jpg", h: 360, idx: 14 },
  ],
  [
    { src: "/images/algarrobo-7.jpg", h: 182, idx: 15 },
    { src: "/images/algarrobo-8.jpg", h: 198, idx: 16 },
    { src: "/images/algarrobo-10.jpg", h: 172, idx: 17 },
  ],
];

const COL_WIDTH = 260;
const COL_GAP = 12;

const Column: React.FC<{
  col: { src: string; h: number; idx: number }[];
  onPhotoClick: (index: number) => void;
}> = ({ col, onPhotoClick }) => (
  <div className="flex flex-col shrink-0" style={{ width: COL_WIDTH, gap: 8 }}>
    {col.map((img) => (
      <button
        key={img.idx}
        onClick={() => onPhotoClick(img.idx)}
        className="group relative overflow-hidden rounded-xl shrink-0 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{ height: img.h }}
      >
        <img
          src={img.src}
          alt={`Foto ${img.idx + 1}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20 backdrop-blur-sm rounded-full p-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          </div>
        </div>
      </button>
    ))}
  </div>
);

export const MasonryScroll: React.FC<MasonryScrollProps> = ({
  onPhotoClick,
  height = 568,
}) => {
  const allCols = [...COLUMNS, ...COLUMNS];

  return (
    <div
      className="w-full overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ height }}
    >
      <div
        className="animate-gallery flex"
        style={{ gap: COL_GAP, width: "max-content" }}
      >
        {allCols.map((col, i) => (
          <Column key={i} col={col} onPhotoClick={onPhotoClick} />
        ))}
      </div>
    </div>
  );
};

export const MASONRY_PHOTOS = COLUMNS.flat().map((img) => ({
  src: img.src,
  title: `Foto ${String(img.idx + 1).padStart(2, "0")}`,
  subtitle: "CeroCuarenta · 2024",
}));
