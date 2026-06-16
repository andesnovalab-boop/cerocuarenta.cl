import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { Product } from "../types";
import { useCart } from "../contexts/CartContext";
import { SEO } from "../components/SEO";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShoppingBag, Ruler } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Descripciones y materiales por nombre de producto
const PRODUCT_DATA: Record<string, { description: string; materials: string[] }> = {
  "Game, set and WTF": {
    description: "Polera Loose Fit de alto gramaje, adulto manga corta, cuello redondo, calce suelto y cómodo. Máxima suavidad. Diseño versátil, ideal para un estilo relajado y moderno.",
    materials: ["100% Algodón", "Tejido Jersey doble 280 grs"],
  },
  "Pressure is a privilege (negra)": {
    description: "Polera Vintage (acid wash) manga corta cuello redondo con costura lateral, calce clásico y máxima suavidad.",
    materials: ["100% Algodón Peinado", "Tejido Jersey Soft Cotton 180 grs"],
  },
  "Pressure is a privilege (gris)": {
    description: "Polera Vintage (acid wash) manga corta cuello redondo con costura lateral, calce clásico y máxima suavidad.",
    materials: ["100% Algodón Peinado", "Tejido Jersey Soft Cotton 180 grs"],
  },
};

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "Talla Única"];

export const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        if (data) {
          const p = data as Product;
          setProduct(p);
          if (p.sizes) {
            const entries = Object.entries(p.sizes);
            const available = entries.find(([, stock]) => stock > 0);
            if (entries.length === 1) setSelectedSize(entries[0][0]);
            else if (available) setSelectedSize(available[0]);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-40">
      <Loader2 className="animate-spin text-court-olive" size={40} />
    </div>
  );
  if (!product) return (
    <div className="text-center py-40 font-bitter italic text-2xl text-court-ink/40">
      Pieza no encontrada.
    </div>
  );

  const handleAddToCart = () => {
    if (!selectedSize) { toast.error("Por favor selecciona una talla"); return; }
    addToCart(product, selectedSize);
    toast.success(`${product.name} (${selectedSize}) añadido al carrito`);
  };

  const isOneSize = product.sizes && Object.keys(product.sizes).length === 1;

  const getDisplayMeasurements = () => {
    if (!product.measurements || Object.keys(product.measurements).length === 0) return null;
    const hasValues = Object.values(product.measurements).some(sizeObj =>
      Object.values(sizeObj).some(val => val && val.toString().trim() !== "")
    );
    return hasValues ? product.measurements : null;
  };
  const displayMeasurements = getDisplayMeasurements();

  const sortedSizes = Object.entries(product.sizes || {}).sort((a, b) => {
    const iA = SIZE_ORDER.indexOf(a[0]);
    const iB = SIZE_ORDER.indexOf(b[0]);
    if (iA === -1 && iB === -1) return a[0].localeCompare(b[0]);
    if (iA === -1) return 1;
    if (iB === -1) return -1;
    return iA - iB;
  });

  const allMeasurementKeys = displayMeasurements
    ? Array.from(new Set(Object.values(displayMeasurements).flatMap(m => Object.keys(m))))
    : [];

  const productData = PRODUCT_DATA[product.name];
  const description = productData?.description || product.description || "Creada para el jugador moderno. Estilo que mezcla la herencia de la cancha con el streetwear de Santiago.";
  const materials = productData?.materials || [];

  const img0 = product.images?.[0] || "/images/sesion1-028.jpg";
  const img1 = product.images?.[1] || null;

  return (
    <div className="min-h-screen bg-white">
      <SEO
        title={product.name}
        description={description}
        image={img0}
        type="product"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-20">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-20 items-start">

          {/* ── Imagen ─────────────────────────────────────────── */}
          <div className="w-full lg:w-1/2 flex flex-col">
            <div
              className="relative aspect-square overflow-hidden rounded-2xl bg-white border border-gray-100 cursor-pointer"
              onClick={() => setShowBack(b => !b)}
            >
              <img
                src={img0}
                alt={product.name}
                className={`absolute inset-0 w-full h-full object-contain p-2 transition-opacity duration-500 ${showBack ? "opacity-0" : "opacity-100"}`}
              />
              {img1 && (
                <img
                  src={img1}
                  alt={`${product.name} dorso`}
                  className={`absolute inset-0 w-full h-full object-contain p-2 transition-opacity duration-500 ${showBack ? "opacity-100" : "opacity-0"}`}
                />
              )}
              {img1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <button
                    onClick={e => { e.stopPropagation(); setShowBack(false); }}
                    className={`text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-full border transition-all ${!showBack ? "bg-court-ink text-white border-court-ink" : "bg-white text-court-ink/40 border-gray-200"}`}
                  >
                    Frente
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setShowBack(true); }}
                    className={`text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-full border transition-all ${showBack ? "bg-court-ink text-white border-court-ink" : "bg-white text-court-ink/40 border-gray-200"}`}
                  >
                    Dorso
                  </button>
                </div>
              )}
            </div>
            <p className="text-center text-[15px] font-bold uppercase tracking-widest text-court-ink/40 mt-5">
              ${product.price.toLocaleString("es-CL")} CLP
            </p>
          </div>

          {/* ── Info ───────────────────────────────────────────── */}
          <div className="w-full lg:w-1/2 flex flex-col gap-6 lg:pt-2">

            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-court-ink/40 hover:text-court-ink transition-all w-fit"
            >
              <ArrowLeft size={16} />
              Volver a la Colección
            </button>

            <h1 className="font-bitter italic text-4xl lg:text-6xl text-court-ink leading-tight tracking-tight">
              {product.name}
            </h1>

            <span className="text-[13px] font-bold uppercase tracking-[0.4em] text-court-olive">
              {product.category}
            </span>

            <p className="text-[16px] text-court-ink/60 leading-relaxed font-medium">
              {description}
            </p>

            {materials.length > 0 && (
              <ul className="space-y-2">
                {materials.map((m) => (
                  <li key={m} className="flex items-center gap-2 text-[14px] font-medium text-court-ink/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-court-olive shrink-0" />
                    {m}
                  </li>
                ))}
              </ul>
            )}

            {/* Guía de tallas */}
            {!isOneSize && displayMeasurements && (
              <div>
                <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-court-olive mb-3">
                  <Ruler size={14} />
                  Guía de tallas
                </p>
                <div className="border border-gray-100 rounded-2xl p-4 overflow-x-auto">
                  <table className="w-full text-[11px] font-bold uppercase tracking-widest whitespace-nowrap">
                    <thead>
                      <tr className="text-court-ink/40 border-b border-gray-100">
                        <th className="py-2 text-left pr-4">Talla</th>
                        {allMeasurementKeys.map(key => (
                          <th key={key} className="py-2 text-center px-3">{key} cm</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_ORDER
                        .filter(s => displayMeasurements[s])
                        .map(size => (
                          <tr key={size} className="border-b border-gray-50 last:border-0 text-court-ink">
                            <td className="py-2 pr-4">{size}</td>
                            {allMeasurementKeys.map((key, i) => (
                              <td key={i} className="py-2 text-center px-3">
                                {displayMeasurements[size]?.[key] || "–"}
                              </td>
                            ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <p className="mt-3 text-[10px] text-court-ink/30 italic">
                    * Medidas aproximadas. Recomendamos medir una prenda que ya tengas.
                  </p>
                </div>
              </div>
            )}

            {/* Selector de tallas */}
            <div>
              <p className="text-[13px] font-bold uppercase tracking-widest text-court-ink/40 mb-3">
                {isOneSize ? "Talla" : "Seleccionar talla"}
              </p>
              <div className="flex flex-wrap gap-3">
                {sortedSizes.map(([size, rawStock]) => {
                  const stock = Number(rawStock);
                  return (
                    <button
                      key={size}
                      disabled={stock === 0 || !!isOneSize}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[60px] h-[60px] px-4 text-[13px] font-bold uppercase tracking-widest transition-all relative
                        ${stock === 0
                          ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                          : selectedSize === size
                            ? "bg-court-ink text-white"
                            : "bg-white border border-gray-200 text-court-ink hover:border-court-ink"
                        }
                        ${isOneSize ? "cursor-default" : ""}
                      `}
                    >
                      {size}
                      {stock < 5 && stock > 0 && !isOneSize && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full leading-none">
                          {stock}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex items-center gap-3 bg-court-ink text-white px-10 py-5 rounded-full font-bold uppercase tracking-widest text-[14px] hover:bg-court-olive transition-all w-fit mt-2"
            >
              <ShoppingBag size={20} />
              Añadir al canasto
            </button>

            <p className="text-[12px] font-bold uppercase tracking-widest text-court-ink/25">
              Envíos a todo Chile
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
