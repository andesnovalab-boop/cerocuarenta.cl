import React, { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CreditCard, Truck, ShieldCheck, ArrowRight, Loader2, User, LogIn, MapPin, Phone, Hash, MessageSquare, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CHILE_REGIONS } from "../constants/chileData";
import { ShippingSettings } from "../types";

type CheckoutStep = "identification" | "shipping" | "method" | "payment";

export const Checkout: React.FC = () => {
  const { cart, total, clearCart } = useCart();
  const { user, loading: loadingAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("identification");
  const [guestEmail, setGuestEmail] = useState("");
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings | null>(null);

  const [shipping, setShipping] = useState({
    full_name: "",
    rut: "",
    phone: "",
    region: "",
    commune: "",
    street: "",
    street_number: "",
    apartment: "",
    notes: "",
  });

  const formatRUT = (value: string) => {
    let cleaned = value.replace(/[^0-9kK]/g, "");
    if (cleaned.length < 2) return cleaned;
    
    const dv = cleaned.slice(-1).toUpperCase();
    const num = cleaned.slice(0, -1);
    
    let formatted = "";
    for (let i = num.length - 1, j = 0; i >= 0; i--, j++) {
      if (j > 0 && j % 3 === 0) formatted = "." + formatted;
      formatted = num[i] + formatted;
    }
    
    return `${formatted}-${dv}`;
  };

  const validateRUT = (rut: string) => {
    let cleaned = rut.replace(/[^0-9kK]/g, "");
    if (cleaned.length < 8) return false;
    
    const dv = cleaned.slice(-1).toUpperCase();
    const num = parseInt(cleaned.slice(0, -1), 10);
    
    let sum = 0;
    let mul = 2;
    let tempNum = num;
    
    while (tempNum > 0) {
      sum += (tempNum % 10) * mul;
      tempNum = Math.floor(tempNum / 10);
      mul = mul === 7 ? 2 : mul + 1;
    }
    
    const expectedDV = 11 - (sum % 11);
    const dvStr = expectedDV === 11 ? "0" : expectedDV === 10 ? "K" : expectedDV.toString();
    
    return dv === dvStr;
  };

  const formatPhone = (value: string) => {
    // Remove all non-numeric characters
    let cleaned = value.replace(/\D/g, "");
    
    // Standardize to 9 digits (removing country code if present)
    if (cleaned.startsWith("569") && cleaned.length === 11) {
      cleaned = cleaned.slice(2);
    } else if (cleaned.startsWith("9") && cleaned.length === 9) {
      // already correct length
    } else if (cleaned.length === 8) {
      cleaned = "9" + cleaned;
    }

    if (cleaned.length === 9 && cleaned.startsWith("9")) {
      return `+56 9 ${cleaned.slice(1)}`;
    }
    
    return value;
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handlePhoneBlur = () => {
    setShipping(prev => ({ ...prev, phone: formatPhone(prev.phone) }));
  };

  const handleRUTBlur = () => {
    setShipping(prev => ({ ...prev, rut: formatRUT(prev.rut) }));
  };

  const [shippingMethod, setShippingMethod] = useState<{id: string, name: string, price: number} | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("shipping_settings")
          .select("*")
          .limit(1)
          .single();
        
        if (data) {
          setShippingSettings(data as ShippingSettings);
        }
      } catch (error) {
        console.error("Error fetching shipping settings:", error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (user && step === "identification") {
      setShipping(prev => ({ ...prev, full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "" }));
      setStep("shipping");
    }
  }, [user, step]);


  const handleGoogleLogin = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/checkout'
        }
      });
    } catch (error) {
      toast.error("Error al iniciar sesión");
    }
  };

  const handleGuestContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.includes("@")) {
      toast.error("Ingresa un email válido");
      return;
    }
    setStep("shipping");
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // RUT Validation
    if (!validateRUT(shipping.rut)) {
      toast.error("El RUT ingresado no es válido");
      return;
    }

    // Phone Validation (basic)
    if (shipping.phone.length < 12) {
      toast.error("Ingresa un número de teléfono válido");
      return;
    }

    // Basic validation
    if (!shipping.rut || !shipping.region || !shipping.commune || !shipping.street || !shipping.street_number) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    setStep("method");
  };

  const isRM = shipping.region === "Región Metropolitana de Santiago";
  
  const getShippingPrice = (id: string, basePrice: number) => {
    if (shippingSettings?.free_shipping_threshold && total >= shippingSettings.free_shipping_threshold) {
      return 0;
    }
    return basePrice;
  };

  const shippingOptions = [
    { 
      id: "rm", 
      name: shippingSettings?.rm.name || "Envío RM (Santiago)", 
      price: getShippingPrice("rm", shippingSettings?.rm.price || 3990), 
      available: isRM 
    },
    { 
      id: "region", 
      name: shippingSettings?.region.name || "Envío a Regiones", 
      price: getShippingPrice("region", shippingSettings?.region.price || 6990), 
      available: !isRM 
    },
  ];

  const handleCheckout = async () => {
    if (!shippingMethod) {
      toast.error("Selecciona un método de envío");
      return;
    }

    setLoading(true);
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id || null,
          customer_email: user?.email || guestEmail,
          items: cart,
          subtotal: total,
          shipping_cost: shippingMethod.price,
          total: total + shippingMethod.price,
          status: "pending",
          shipping_address: {
            ...shipping,
            address: [shipping.street, shipping.street_number, shipping.apartment].filter(Boolean).join(", "),
          },
          shipping_method: shippingMethod.name
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create MercadoPago preference
      const response = await fetch("/api/checkout/mp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderData.id,
          items: cart,
          customerEmail: user?.email || guestEmail,
          total: total + shippingMethod.price,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Error al iniciar el pago");
        setLoading(false);
      }

    } catch (error: any) {
      console.error("Checkout Error:", error);
      toast.error("Error al procesar la orden");
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate("/cart");
    return null;
  }

  const selectedRegion = CHILE_REGIONS.find(r => r.name === shipping.region);

  return (
    <div className="max-w-7xl mx-auto px-8 py-24 bg-court-cream min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-baseline mb-16 gap-8">
        <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter text-court-ink leading-none">CHECKOUT</h1>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-4">
          {["identification", "shipping", "method", "payment"].map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-3 h-3 rounded-full transition-all duration-500 ${
                step === s ? "bg-court-olive scale-125" : 
                ["identification", "shipping", "method", "payment"].indexOf(step) > i ? "bg-court-olive/40" : "bg-court-ink/10"
              }`} />
              {i < 3 && <div className="w-8 h-[2px] bg-court-ink/5" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {step === "identification" && !user && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-12"
              >
                <div className="bg-white p-12 rounded-[3rem] border border-court-olive/10 shadow-xl">
                  <h2 className="text-2xl font-serif italic mb-8">Identificación</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <p className="text-sm text-court-ink/60 font-medium">Inicia sesión para una experiencia más rápida y seguimiento de tus pedidos.</p>
                      <button 
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-4 px-8 py-4 bg-white border border-court-olive/20 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-court-olive/5 transition-all"
                      >
                        <LogIn size={18} /> Iniciar con Google
                      </button>
                      <button 
                        onClick={() => navigate("/login")}
                        className="w-full flex items-center justify-center gap-4 px-8 py-4 bg-court-ink text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-court-olive transition-all"
                      >
                        <User size={18} /> Ya tengo cuenta
                      </button>
                    </div>
                    
                    <div className="border-t md:border-t-0 md:border-l border-court-olive/10 pt-8 md:pt-0 md:pl-8 space-y-6">
                      <p className="text-sm text-court-ink/60 font-medium">O continúa como invitado si prefieres no crear una cuenta ahora.</p>
                      <form onSubmit={handleGuestContinue} className="space-y-4">
                        <input 
                          type="email"
                          placeholder="TU@EMAIL.COM"
                          required
                          className="w-full px-6 py-4 bg-court-cream/50 border border-court-olive/10 rounded-2xl outline-none focus:border-court-olive transition-all text-xs font-bold"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          onBlur={() => {
                            if (guestEmail && !validateEmail(guestEmail)) {
                              toast.error("Formato de email inválido");
                            }
                          }}
                        />
                        <button 
                          type="submit"
                          className="w-full flex items-center justify-center gap-4 px-8 py-4 bg-white border border-court-ink text-court-ink rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-court-ink hover:text-white transition-all"
                        >
                          Continuar como Invitado <ArrowRight size={18} />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "shipping" && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleShippingSubmit} className="bg-white p-12 rounded-[3rem] border border-court-olive/10 shadow-xl space-y-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-court-olive/10 rounded-full flex items-center justify-center text-court-olive">
                      <MapPin size={24} />
                    </div>
                    <h2 className="text-2xl font-serif italic">Datos de Envío</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-3 flex items-center gap-2">
                        <User size={12} /> Nombre y Apellido
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-6 py-4 bg-court-cream/30 border border-court-olive/10 rounded-2xl focus:border-court-olive outline-none transition-all"
                        value={shipping.full_name}
                        onChange={(e) => setShipping({ ...shipping, full_name: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-3 flex items-center gap-2">
                        <Hash size={12} /> RUT
                      </label>
                      <input
                        required
                        placeholder="12.345.678-9"
                        type="text"
                        className="w-full px-6 py-4 bg-court-cream/30 border border-court-olive/10 rounded-2xl focus:border-court-olive outline-none transition-all"
                        value={shipping.rut}
                        onChange={(e) => setShipping({ ...shipping, rut: e.target.value })}
                        onBlur={handleRUTBlur}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-3 flex items-center gap-2">
                        <Phone size={12} /> Teléfono de Contacto
                      </label>
                      <input
                        required
                        placeholder="+56 9 ..."
                        type="tel"
                        className="w-full px-6 py-4 bg-court-cream/30 border border-court-olive/10 rounded-2xl focus:border-court-olive outline-none transition-all"
                        value={shipping.phone}
                        onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                        onBlur={handlePhoneBlur}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-3">Región</label>
                      <select
                        required
                        className="w-full px-6 py-4 bg-court-cream/30 border border-court-olive/10 rounded-2xl focus:border-court-olive outline-none transition-all appearance-none"
                        value={shipping.region}
                        onChange={(e) => setShipping({ ...shipping, region: e.target.value, commune: "" })}
                      >
                        <option value="">Selecciona Región</option>
                        {CHILE_REGIONS.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-3">Comuna</label>
                      <select
                        required
                        disabled={!shipping.region}
                        className="w-full px-6 py-4 bg-court-cream/30 border border-court-olive/10 rounded-2xl focus:border-court-olive outline-none transition-all appearance-none disabled:opacity-50"
                        value={shipping.commune}
                        onChange={(e) => setShipping({ ...shipping, commune: e.target.value })}
                      >
                        <option value="">Selecciona Comuna</option>
                        {selectedRegion?.communes.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-3 flex items-center gap-2">
                        <MapPin size={12} /> Calle / Av. / Pasaje
                      </label>
                      <input
                        required
                        placeholder="Ej: Av. Providencia"
                        type="text"
                        className="w-full px-6 py-4 bg-court-cream/30 border border-court-olive/10 rounded-2xl focus:border-court-olive outline-none transition-all"
                        value={shipping.street}
                        onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-3 flex items-center gap-2">
                        <Hash size={12} /> Número
                      </label>
                      <input
                        required
                        placeholder="Ej: 1234"
                        type="text"
                        className="w-full px-6 py-4 bg-court-cream/30 border border-court-olive/10 rounded-2xl focus:border-court-olive outline-none transition-all"
                        value={shipping.street_number}
                        onChange={(e) => setShipping({ ...shipping, street_number: e.target.value })}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-3">
                        Depto / Casa / Oficina <span className="text-court-ink/20">(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Depto 502, Casa B"
                        className="w-full px-6 py-4 bg-court-cream/30 border border-court-olive/10 rounded-2xl focus:border-court-olive outline-none transition-all"
                        value={shipping.apartment}
                        onChange={(e) => setShipping({ ...shipping, apartment: e.target.value })}
                      />
                    </div>

<div className="md:col-span-2">
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-3 flex items-center gap-2">
                        <MessageSquare size={12} /> Notas Adicionales (Opcional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Ej: Casa portón verde, dejar en conserjería..."
                        className="w-full px-6 py-4 bg-court-cream/30 border border-court-olive/10 rounded-2xl focus:border-court-olive outline-none transition-all resize-none"
                        value={shipping.notes}
                        onChange={(e) => setShipping({ ...shipping, notes: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="pt-8 flex justify-between items-center">
                    {!user && (
                      <button type="button" onClick={() => setStep("identification")} className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40 hover:text-court-ink">
                        Volver
                      </button>
                    )}
                    <button
                      type="submit"
                      className="ml-auto bg-court-ink text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest hover:bg-court-olive transition-all flex items-center gap-4"
                    >
                      Siguiente Paso <ArrowRight size={18} />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === "method" && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white p-12 rounded-[3rem] border border-court-olive/10 shadow-xl">
                  <div className="flex items-center gap-4 mb-12">
                    <div className="w-12 h-12 bg-court-olive/10 rounded-full flex items-center justify-center text-court-olive">
                      <Truck size={24} />
                    </div>
                    <h2 className="text-2xl font-serif italic">Método de Envío</h2>
                  </div>

                  <div className="space-y-4">
                    {shippingOptions.map((option) => (
                      <button
                        key={option.id}
                        disabled={!option.available}
                        onClick={() => setShippingMethod(option)}
                        className={`w-full p-8 rounded-[2rem] border-2 transition-all flex items-center justify-between text-left ${
                          !option.available ? "opacity-30 cursor-not-allowed border-transparent bg-court-ink/5" :
                          shippingMethod?.id === option.id ? "border-court-olive bg-court-olive/5" : "border-court-olive/10 bg-white hover:border-court-olive/40"
                        }`}
                      >
                        <div className="flex items-center gap-6">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${shippingMethod?.id === option.id ? "border-court-olive" : "border-court-ink/10"}`}>
                            {shippingMethod?.id === option.id && <div className="w-3 h-3 rounded-full bg-court-olive" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm uppercase tracking-widest mb-1">{option.name}</p>
                            <p className="text-[10px] text-court-ink/40 font-medium">
                              {option.available ? (
                                option.price === 0 ? (
                                  <span className="text-court-olive font-bold">¡ENVÍO GRATIS POR TU COMPRA!</span>
                                ) : (
                                  "Entrega estimada: 2-4 días hábiles"
                                )
                              ) : "No disponible para tu ubicación"}
                            </p>
                          </div>
                        </div>
                        <span className="text-xl font-serif italic">
                          {option.price === 0 ? "Gratis" : `$${option.price.toLocaleString("es-CL")}`}
                        </span>
                      </button>
                    ))}

                    {shippingSettings?.conditions && (
                      <div className="mt-12 p-8 bg-court-cream/50 rounded-3xl border border-court-olive/10 flex gap-6 items-start">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-court-olive shadow-sm flex-shrink-0">
                          <Info size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Condiciones de Envío</p>
                          <p className="text-sm text-court-ink/60 font-medium leading-relaxed">{shippingSettings.conditions}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-12 flex justify-between items-center">
                    <button onClick={() => setStep("shipping")} className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40 hover:text-court-ink">
                      Volver a Datos de Envío
                    </button>
                    <button
                      onClick={() => setStep("payment")}
                      disabled={!shippingMethod}
                      className="bg-court-ink text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest hover:bg-court-olive transition-all flex items-center gap-4 disabled:opacity-50"
                    >
                      Continuar al Pago <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "payment" && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="bg-white p-12 rounded-[3rem] border border-court-olive/10 shadow-xl text-center">
                  <div className="w-20 h-20 bg-court-olive/10 rounded-full flex items-center justify-center text-court-olive mx-auto mb-8">
                    <CreditCard size={40} />
                  </div>
                  <h2 className="text-4xl font-serif italic mb-6">Resumen Final</h2>
                  <p className="text-court-ink/60 mb-12 max-w-md mx-auto">Estás a un paso de completar tu pedido. Al hacer clic en el botón, serás redirigido a nuestra pasarela de pago segura.</p>
                  
                  <div className="bg-court-cream/50 p-8 rounded-[2rem] border border-court-olive/10 mb-12 text-left space-y-4">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-court-ink/40">
                      <span>Subtotal</span>
                      <span>${total.toLocaleString("es-CL")}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-court-ink/40">
                      <span>Envío ({shippingMethod?.name})</span>
                      <span>${shippingMethod?.price.toLocaleString("es-CL")}</span>
                    </div>
                    <div className="h-px bg-court-olive/10 my-4"></div>
                    <div className="flex justify-between text-3xl font-serif italic text-court-ink">
                      <span>Total a Pagar</span>
                      <span className="text-court-olive">${(total + (shippingMethod?.price || 0)).toLocaleString("es-CL")}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                    <button
                      onClick={handleCheckout}
                      disabled={loading}
                      className="w-full bg-court-ink text-white py-6 rounded-full font-bold uppercase tracking-widest hover:bg-court-olive transition-all shadow-2xl shadow-court-ink/20 flex items-center justify-center gap-4 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : <><CreditCard size={20} /> Pagar con MercadoPago</>}
                    </button>
                    <button onClick={() => setStep("method")} className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40 hover:text-court-ink">
                      Cambiar método de envío
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-court-olive/10 shadow-xl sticky top-24">
            <h2 className="text-xl font-bold uppercase tracking-widest text-court-ink mb-8">Tu Carrito</h2>
            <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
              {cart.map((item) => (
                <div key={`${item.id}-${item.selectedSize}`} className="flex gap-4">
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-court-cream shrink-0">
                    <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center flex-grow">
                    <p className="text-xs font-bold text-court-ink line-clamp-1">{item.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40">Talla: {item.selectedSize} • x{item.quantity}</p>
                    <p className="text-xs font-bold text-court-olive mt-1">${(item.price * item.quantity).toLocaleString("es-CL")}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-px bg-court-olive/10 my-8"></div>

            <div className="space-y-4">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-court-ink/40">
                <span>Subtotal</span>
                <span>${total.toLocaleString("es-CL")}</span>
              </div>
              {shippingMethod && (
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-court-ink/40">
                  <span>Envío</span>
                  <span>${shippingMethod.price.toLocaleString("es-CL")}</span>
                </div>
              )}
              <div className="flex justify-between text-2xl font-serif italic text-court-ink pt-2">
                <span>Total</span>
                <span className="text-court-olive">${(total + (shippingMethod?.price || 0)).toLocaleString("es-CL")}</span>
              </div>
            </div>

            <div className="mt-12 bg-court-olive/5 p-6 rounded-2xl border border-court-olive/10 flex items-center gap-4">
              <ShieldCheck className="text-court-olive" size={24} />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest text-court-ink">Compra Protegida</p>
                <p className="text-[9px] text-court-ink/40 font-medium leading-tight">Garantía de satisfacción CeroCuarenta.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

