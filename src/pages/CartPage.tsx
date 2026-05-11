import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";

export const CartPage: React.FC = () => {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-8 py-32 text-center">
        <div className="w-24 h-24 bg-court-olive/5 rounded-full flex items-center justify-center mx-auto mb-8 text-court-olive/20">
          <ShoppingBag size={48} />
        </div>
        <h1 className="text-5xl font-serif italic mb-6">Tu carrito está vacío</h1>
        <p className="text-court-ink/40 mb-12 max-w-md mx-auto font-medium">
          Parece que aún no has añadido nada. Explora nuestra última colección y encuentra tu estilo perfecto.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-3 bg-court-olive text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest hover:bg-court-ink transition-all shadow-xl shadow-court-olive/20"
        >
          Explorar Colección
          <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-8 py-24 bg-court-cream min-h-screen">
      <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter text-court-ink mb-16 leading-none">TU CARRITO</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
        <div className="lg:col-span-2 space-y-12">
          {cart.map((item) => (
            <div key={`${item.id}-${item.selectedSize}`} className="flex gap-8 pb-12 border-b border-court-olive/10 group">
              <div className="w-32 aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 shrink-0 shadow-lg">
                <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-grow py-2">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-serif italic">{item.name}</h3>
                  <button 
                    onClick={() => removeFromCart(item.id, item.selectedSize)}
                    className="text-court-ink/20 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex items-center gap-4 mb-8">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40">{item.category}</p>
                  <span className="w-1 h-1 bg-court-olive/20 rounded-full"></span>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-court-olive">Talla: {item.selectedSize}</p>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center border border-court-olive/10 rounded-full px-4 py-2 gap-6">
                    <button 
                      onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity - 1)}
                      className="text-court-ink/40 hover:text-court-olive transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity + 1)}
                      className="text-court-ink/40 hover:text-court-olive transition-all"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="text-lg font-bold">${(item.price * item.quantity).toLocaleString("es-CL")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-12 rounded-[3rem] border border-court-olive/10 shadow-2xl shadow-court-olive/5 sticky top-32">
            <h2 className="text-xl font-bold uppercase tracking-widest text-court-ink mb-12">Resumen</h2>
            
            <div className="space-y-6 mb-12">
              <div className="flex justify-between text-sm">
                <span className="text-court-ink/40 font-medium">Subtotal</span>
                <span className="font-bold">${total.toLocaleString("es-CL")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-court-ink/40 font-medium">Envío</span>
                <span className="font-bold text-court-ink/40">Se calcula en checkout</span>
              </div>
            </div>

            <div className="h-px bg-court-olive/10 my-8"></div>

            <div className="flex justify-between text-4xl font-serif italic mb-12">
              <span>TOTAL</span>
              <span className="text-court-olive">${total.toLocaleString("es-CL")}</span>
            </div>

            <button 
              onClick={() => navigate("/checkout")}
              className="w-full bg-court-ink text-white py-6 rounded-full font-bold uppercase tracking-widest hover:bg-court-olive transition-all shadow-xl shadow-court-ink/20 flex items-center justify-center gap-4"
            >
              Finalizar Compra <ArrowRight size={20} />
            </button>

            <p className="text-[10px] text-center text-court-ink/40 font-medium mt-8 leading-relaxed uppercase tracking-widest">
              Envío gratis en compras sobre $80.000
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
