import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import { useAuth } from "../contexts/AuthContext";
import { Order } from "../types";
import { Package, Clock, CheckCircle, Truck, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Orders: React.FC = () => {
  const { user, loading: loadingAuth } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (loadingAuth) return;
    if (!user) { setLoading(false); return; }
    fetchOrders(user.id);
  }, [user, loadingAuth]);

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setOrders((data || []) as Order[]);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="text-orange-500" size={18} />;
      case "paid": return <CheckCircle className="text-green-500" size={18} />;
      case "shipped": return <Truck className="text-blue-500" size={18} />;
      case "cancelled": return <XCircle className="text-red-500" size={18} />;
      default: return <Package className="text-gray-500" size={18} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pendiente de Pago";
      case "paid": return "Pagado / Procesando";
      case "shipped": return "Enviado";
      case "cancelled": return "Cancelado";
      default: return status;
    }
  };

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin text-court-olive" size={40} /></div>;

  return (
    <div className="max-w-7xl mx-auto px-8 py-24 bg-court-cream">
      <h1 className="text-7xl font-serif italic tracking-tighter text-court-ink mb-16 leading-none">MIS PEDIDOS</h1>

      {orders.length > 0 ? (
        <div className="space-y-12">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-court-olive/10 rounded-[3rem] overflow-hidden shadow-2xl shadow-court-olive/5 hover:border-court-olive/30 transition-all">
              <div className="p-8 bg-court-olive/5 border-b border-court-olive/10 flex flex-wrap justify-between items-center gap-8">
                <div className="flex items-center gap-12">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Fecha</p>
                    <p className="text-sm font-bold text-court-ink">
                      {order.created_at ? format(new Date(order.created_at), "dd MMM yyyy", { locale: es }) : "--"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Total</p>
                    <p className="text-sm font-bold text-court-ink">${order.total.toLocaleString("es-CL")}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Orden ID</p>
                    <p className="text-sm font-bold text-court-olive">#{order.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-court-olive/10 shadow-sm">
                  {getStatusIcon(order.status)}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-court-ink">{getStatusLabel(order.status)}</span>
                </div>
              </div>

              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-2 space-y-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-court-olive/5">
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-bold text-court-ink">{item.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40">Cantidad: {item.quantity} • ${item.price.toLocaleString("es-CL")}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-court-olive/5 p-8 rounded-[2rem] border border-court-olive/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-4">Envío</p>
                  <p className="text-xs font-bold text-court-ink mb-1">{order.shipping_address?.full_name}</p>
                  <p className="text-xs text-court-ink/60 mb-6 leading-relaxed">
                    {order.shipping_address?.address}, {order.shipping_address?.commune}, {order.shipping_address?.region}
                  </p>
                  
                  <p className="text-[9px] font-bold uppercase tracking-widest text-court-ink/30 text-center mt-2">
                    Boleta disponible próximamente
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-court-olive/20">
          <Package className="mx-auto text-court-olive/20 mb-6" size={64} />
          <p className="text-court-ink/40 font-bold uppercase tracking-widest">Aún no has realizado ningún pedido.</p>
        </div>
      )}
    </div>
  );
};
