import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import { Product } from "../types";
import { useCart } from "../contexts/CartContext";
import { SEO } from "../components/SEO";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShoppingBag, ChevronDown, Ruler } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [showSizeGuide, setShowSizeGuide] = useState(false);

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
          const productData = data as Product;
          setProduct(productData);
          
          if (productData.sizes) {
            const sizeEntries = Object.entries(productData.sizes);
            const available = sizeEntries.find(([_, stock]) => stock > 0);
            
            if (sizeEntries.length === 1) {
              setSelectedSize(sizeEntries[0][0]);
            } else if (available) {
              setSelectedSize(available[0]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin text-court-olive" size={40} /></div>;
  if (!product) return <div className="text-center py-40 font-serif italic text-2xl">Pieza no encontrada.</div>;

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Por favor selecciona una talla");
      return;
    }
    addToCart(product, selectedSize);
    toast.success(`${product.name} (${selectedSize}) AÑADIDO AL CARRITO`);
  };

  const isOneSize = product.sizes && Object.keys(product.sizes).length === 1;

  // Fallback measurements if not defined in DB
  const getDisplayMeasurements = () => {
    // 1. Use DB measurements if they exist and have at least one real value
    if (product.measurements && Object.keys(product.measurements).length > 0) {
      const hasValues = Object.values(product.measurements).some(sizeObj => 
        Object.values(sizeObj).some(val => val && val.toString().trim() !== "")
      );
      if (hasValues) return product.measurements;
    }

    // 2. Fallbacks for categories (case-insensitive)
    const category = (product.category || "").toLowerCase().trim();
    
    if (category === "polera") {
      return {
        "S": { "Ancho": "50", "Largo": "70", "Hombros": "46" },
        "M": { "Ancho": "53", "Largo": "72", "Hombros": "48" },
        "L": { "Ancho": "56", "Largo": "74", "Hombros": "50" },
        "XL": { "Ancho": "59", "Largo": "76", "Hombros": "52" }
      };
    }
    
    if (category === "poleron") {
      return {
        "S": { "Ancho": "54", "Largo": "68", "Manga": "60" },
        "M": { "Ancho": "57", "Largo": "70", "Manga": "62" },
        "L": { "Ancho": "60", "Largo": "72", "Manga": "64" },
        "XL": { "Ancho": "63", "Largo": "74", "Manga": "66" }
      };
    }

    if (category === "pantalon") {
      return {
        "S": { "Cintura": "76", "Cadera": "96", "Largo": "100" },
        "M": { "Cintura": "80", "Cadera": "100", "Largo": "102" },
        "L": { "Cintura": "84", "Cadera": "104", "Largo": "104" },
        "XL": { "Cintura": "88", "Cadera": "108", "Largo": "106" }
      };
    }

    if (category === "short") {
      return {
        "S": { "Cintura": "76", "Largo": "40" },
        "M": { "Cintura": "80", "Largo": "41" },
        "L": { "Cintura": "84", "Largo": "42" },
        "XL": { "Cintura": "88", "Largo": "43" }
      };
    }

    return null;
  };

  const displayMeasurements = getDisplayMeasurements();

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      <SEO 
        title={product.name} 
        description={product.description} 
        image={product.images?.[0] || "/images/algarrobo-0.jpg"} 
        type="product"
      />
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-court-ink/40 hover:text-court-ink mb-12 transition-all"
      >
        <ArrowLeft size={16} />
        Volver a la Colección
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
        {/* Image Section */}
        <div className="aspect-[3/4] rounded-[3rem] overflow-hidden bg-court-olive/5 shadow-2xl shadow-court-olive/10">
          <img 
            src={product.images?.[0] || "/images/algarrobo-0.jpg"} 
            alt={product.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Info Section */}
        <div className="flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-court-olive mb-6">
            {product.category}
          </p>
          <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter text-court-ink mb-8 leading-[0.9]">
            {product.name}
          </h1>
          <div className="flex items-baseline gap-6 mb-12">
            <p className="text-2xl font-bold text-court-ink">
              ${product.price.toLocaleString("es-CL")}
            </p>
            {isOneSize && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-court-olive bg-court-olive/5 px-3 py-1 rounded-full border border-court-olive/10">
                Talla Única
              </span>
            )}
          </div>
          
          <div className="h-px bg-court-olive/10 w-full mb-12"></div>
          
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40">
                {isOneSize ? "Talla" : "Seleccionar Talla"}
              </p>
              {!isOneSize && displayMeasurements && Object.keys(displayMeasurements).length > 0 && (
                <button 
                  onClick={() => setShowSizeGuide(!showSizeGuide)}
                  className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-court-olive hover:text-court-ink transition-all"
                >
                  <Ruler size={14} />
                  Guía de Tallas
                  <ChevronDown size={14} className={`transition-transform duration-300 ${showSizeGuide ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            <AnimatePresence>
              {showSizeGuide && displayMeasurements && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mb-8"
                >
                  <div className="bg-white border border-court-olive/10 rounded-3xl p-6 shadow-sm overflow-x-auto">
                    <table className="w-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                      <thead>
                        <tr className="text-court-ink/40 border-b border-court-olive/5">
                          <th className="py-3 text-left pr-4">Talla</th>
                          {Array.from(new Set(Object.values(displayMeasurements).flatMap(m => Object.keys(m)))).map(key => (
                            <th key={key} className="py-3 text-center px-4">{key} (cm)</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-court-ink">
                        {(() => {
                          const sizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "Talla Única"];
                          const sortedSizes = Object.keys(product.sizes || {}).sort((a, b) => {
                            const indexA = sizeOrder.indexOf(a);
                            const indexB = sizeOrder.indexOf(b);
                            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                            if (indexA === -1) return 1;
                            if (indexB === -1) return -1;
                            return indexA - indexB;
                          });
                          
                          const allKeys = Array.from(new Set(Object.values(displayMeasurements).flatMap(m => Object.keys(m))));

                          return sortedSizes.map(size => (
                            <tr key={size} className="border-b border-court-olive/5 last:border-0">
                              <td className="py-3 pr-4">{size}</td>
                              {allKeys.map((key, i) => (
                                <td key={i} className="py-3 text-center px-4">
                                  {displayMeasurements?.[size]?.[key] || "-"}
                                </td>
                              ))}
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                    <p className="mt-4 text-[8px] text-court-ink/40 italic">
                      * Medidas aproximadas. Recomendamos medir una prenda que ya tengas.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-wrap gap-4">
              {(() => {
                const sizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "Talla Única"];
                return Object.entries(product.sizes || {}).sort((a, b) => {
                  const indexA = sizeOrder.indexOf(a[0]);
                  const indexB = sizeOrder.indexOf(b[0]);
                  if (indexA === -1 && indexB === -1) return a[0].localeCompare(b[0]);
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  return indexA - indexB;
                }).map(([size, stock]) => (
                  <button
                    key={size}
                    disabled={stock === 0 || isOneSize}
                    onClick={() => setSelectedSize(size)}
                    className={`
                      min-w-[60px] h-[60px] rounded-2xl flex items-center justify-center text-[10px] font-bold uppercase tracking-widest transition-all relative
                      ${stock === 0 
                        ? "bg-court-ink/5 text-court-ink/20 cursor-not-allowed" 
                        : selectedSize === size
                          ? "bg-court-olive text-white shadow-lg shadow-court-olive/20"
                          : "bg-white border border-court-olive/10 text-court-ink hover:border-court-olive"
                      }
                      ${isOneSize ? "cursor-default" : ""}
                    `}
                  >
                    {size}
                    {stock < 5 && stock > 0 && !isOneSize && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] px-2 py-1 rounded-full">
                        {stock}
                      </span>
                    )}
                  </button>
                ));
              })()}
            </div>
          </div>

          <p className="text-court-ink/60 leading-relaxed mb-16 font-medium max-w-md">
            {product.description || "Creada con precisión y diseñada para el jugador moderno. Esta pieza encarna la herencia de la cancha con un rendimiento contemporáneo."}
          </p>

          <div className="flex flex-col gap-6">
            <button 
              onClick={handleAddToCart}
              className="bg-court-olive text-white px-12 py-6 rounded-full font-bold uppercase tracking-widest hover:bg-court-ink transition-all shadow-2xl shadow-court-olive/20 flex items-center justify-center gap-4"
            >
              <ShoppingBag size={20} />
              Añadir al Carrito
            </button>
            <div className="bg-court-ink/5 p-6 rounded-[2rem] border border-court-olive/10">
              <p className="text-[10px] font-bold uppercase tracking-widest text-court-olive mb-2">Beneficio Miembro del Club</p>
              <p className="text-[11px] text-court-ink/60 leading-relaxed">
                Los miembros del club reciben <span className="text-court-ink font-bold">envío gratuito</span> en todos los pedidos en Chile y puntos para el próximo drop.
              </p>
            </div>
            <p className="text-[10px] text-center font-bold uppercase tracking-widest text-court-ink/20">
              Envío gratuito en todos los pedidos en Chile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
