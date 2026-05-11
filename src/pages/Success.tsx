import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Clock, Package, ShoppingBag } from "lucide-react";
import { useCart } from "../contexts/CartContext";

export const Success: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  // MercadoPago sends: payment_id, status, external_reference (our orderId), merchant_order_id
  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const orderId = searchParams.get("external_reference") || searchParams.get("orderId");

  const isPending = status === "pending";

  useEffect(() => {
    clearCart();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-8 py-32 text-center bg-court-cream min-h-[80vh]">
      <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-12 shadow-2xl ${isPending ? "bg-court-ink/10 text-court-ink shadow-court-ink/10" : "bg-court-olive/10 text-court-olive shadow-court-olive/20"}`}>
        {isPending ? <Clock size={64} /> : <CheckCircle size={64} />}
      </div>

      <h1 className="text-8xl font-serif italic tracking-tighter text-court-ink mb-6 leading-none">
        {isPending ? "¡PAGO PENDIENTE!" : "¡PAGO EXITOSO!"}
      </h1>

      <p className="text-court-ink/40 font-bold uppercase tracking-[0.3em] text-sm mb-4">
        {isPending
          ? "Tu pago está siendo procesado."
          : "Tu pedido ha sido procesado correctamente."}
      </p>

      {orderId && (
        <p className="text-xs font-bold text-court-olive uppercase tracking-[0.2em] mb-16">
          Orden ID: {orderId}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
        {orderId && !orderId.startsWith("guest") && (
          <Link
            to="/orders"
            className="flex items-center justify-center gap-4 bg-court-ink text-white px-12 py-6 rounded-full font-bold uppercase tracking-widest hover:bg-court-olive transition-all shadow-xl shadow-court-ink/20"
          >
            <Package size={20} /> Ver Mis Pedidos
          </Link>
        )}
        <Link
          to="/"
          className="flex items-center justify-center gap-4 bg-white text-court-ink px-12 py-6 rounded-full font-bold uppercase tracking-widest border border-court-olive/10 hover:bg-court-olive hover:text-white transition-all shadow-lg"
        >
          <ShoppingBag size={20} /> Seguir Comprando
        </Link>
      </div>

      <div className="mt-24 p-12 bg-white rounded-[3rem] border border-court-olive/10 shadow-2xl shadow-court-olive/5 max-w-2xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-8">Próximos Pasos</p>
        <div className="space-y-8 text-left">
          <div className="flex gap-6 items-start">
            <div className="w-10 h-10 bg-court-olive/5 rounded-full flex items-center justify-center font-serif italic text-lg text-court-olive shadow-sm flex-shrink-0">1</div>
            <p className="text-sm text-court-ink/60 font-medium leading-relaxed">Recibirás un correo de confirmación con los detalles de tu compra y acceso exclusivo al Club.</p>
          </div>
          <div className="flex gap-6 items-start">
            <div className="w-10 h-10 bg-court-olive/5 rounded-full flex items-center justify-center font-serif italic text-lg text-court-olive shadow-sm flex-shrink-0">2</div>
            <p className="text-sm text-court-ink/60 font-medium leading-relaxed">Prepararemos tu pedido con el cuidado que merece y te notificaremos cuando sea enviado desde Santiago.</p>
          </div>
          <div className="flex gap-6 items-start">
            <div className="w-10 h-10 bg-court-olive/5 rounded-full flex items-center justify-center font-serif italic text-lg text-court-olive shadow-sm flex-shrink-0">3</div>
            <p className="text-sm text-court-ink/60 font-medium leading-relaxed">Podrás descargar tu boleta electrónica y seguir el estado de tu envío desde el panel de pedidos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
