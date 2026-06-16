import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Eye } from "lucide-react";
import { Product } from "../types";
import { useCart } from "../contexts/CartContext";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [activeImg, setActiveImg] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  const isOutOfStock = product.stock === 0;
  const hasMultipleSizes = product.sizes && Object.keys(product.sizes).length > 1;
  const sizes = Object.keys(product.sizes || {});

  const handleQuickAdd = (e: React.MouseEvent, size?: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasMultipleSizes && !size) return;
    const selectedSize = size || sizes[0] || "Única";
    setIsAdding(true);
    addToCart(product, selectedSize);
    toast.success(`${product.name} (${selectedSize}) añadido`, { duration: 2000 });
    setTimeout(() => setIsAdding(false), 600);
  };

  return (
    <div className="group relative flex flex-col">
      <Link to={`/product/${product.id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white mb-4">
          <img
            src={product.images?.[0] || "/images/algarrobo-0.jpg"}
            alt={product.name}
            className={`absolute inset-0 w-full h-full object-contain p-2 transition-opacity duration-500 ${
              isOutOfStock ? "grayscale opacity-40" : "opacity-100 group-hover:opacity-0"
            }`}
            loading="lazy"
          />
          {product.images?.[1] && (
            <img
              src={product.images[1]}
              alt={`${product.name} dorso`}
              className="absolute inset-0 w-full h-full object-contain p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              loading="lazy"
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {isOutOfStock ? (
              <span className="bg-gray-800 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Agotado
              </span>
            ) : product.featured ? (
              <span className="bg-court-olive text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Destacado
              </span>
            ) : null}
            {product.stock > 0 && product.stock <= 5 && (
              <span className="bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                Últimas {product.stock}
              </span>
            )}
          </div>

          {/* Frente / Dorso label */}
          {product.images?.[1] && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[8px] font-bold uppercase tracking-widest text-court-ink/40 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full">
                Dorso
              </span>
            </div>
          )}

          {/* Quick Action Bar */}
          {!isOutOfStock && (
            <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              {hasMultipleSizes ? (
                <Link
                  to={`/product/${product.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-white/95 backdrop-blur-sm text-court-ink text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-court-olive hover:text-white transition-all shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye size={14} />
                  Seleccionar Talla
                </Link>
              ) : (
                <button
                  onClick={handleQuickAdd}
                  disabled={isAdding}
                  className="flex items-center justify-center gap-2 w-full bg-white/95 backdrop-blur-sm text-court-ink text-[10px] font-bold uppercase tracking-widest py-3 rounded-xl hover:bg-court-olive hover:text-white transition-all shadow-lg disabled:opacity-70"
                >
                  <ShoppingBag size={14} />
                  {isAdding ? "Añadido ✓" : "Añadir al Carrito"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="px-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-court-olive/80 mb-1">
            {product.category}
          </p>
          <h3 className="text-[18px] font-semibold text-court-ink mb-1.5 group-hover:text-court-olive transition-colors leading-snug line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-bold uppercase tracking-widest text-court-ink/50">
              ${product.price.toLocaleString("es-CL")}
            </p>
            {!isOutOfStock && !hasMultipleSizes && (
              <button
                onClick={handleQuickAdd}
                className="text-[11px] font-bold uppercase tracking-widest text-court-olive hover:text-court-ink transition-colors"
              >
                + Carrito
              </button>
            )}
          </div>

          {hasMultipleSizes && !isOutOfStock && (
            <div className="flex gap-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {Object.entries(product.sizes || {}).map(([size, stock]) => (
                <span
                  key={size}
                  className={`text-[9px] font-bold px-2 py-0.5 border rounded-full ${
                    stock === 0
                      ? "border-gray-200 text-gray-300 line-through"
                      : "border-court-olive/30 text-court-olive"
                  }`}
                >
                  {size}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};
