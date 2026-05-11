import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Product, Order, ProductCategory, ShippingSettings, BlogPost, BlogCategory } from "../types";
import { toast } from "sonner";
import {
  Plus, Trash2, Edit2, Package, ShoppingCart, Users, Loader2, Upload,
  Image as ImageIcon, ShieldCheck, UserCheck, Settings, Save, FileText,
  Eye, EyeOff, Star, ChevronDown, ChevronUp, Truck, Download, Mail,
  TrendingUp, CheckCircle2,
} from "lucide-react";

type Tab = "products" | "orders" | "stock" | "subscribers" | "users" | "settings" | "blog";

const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button
    type="button"
    onClick={() => onChange(!value)}
    className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${value ? "bg-court-olive" : "bg-gray-200"}`}
  >
    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
  </button>
);

export const AdminDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<{ email: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("products");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showClearOrdersModal, setShowClearOrdersModal] = useState(false);

  // ── Blog ──
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogForm, setBlogForm] = useState<Partial<BlogPost>>({ title: "", slug: "", excerpt: "", content: "", cover_image: "", category: "Cultura", author: "CeroCuarenta", published: false });
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [savingPost, setSavingPost] = useState(false);

  // ── Shipping ──
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>({
    rm: { name: "Envío RM (Santiago)", price: 3990 },
    region: { name: "Envío a Regiones", price: 6990 },
    free_shipping_threshold: 80000,
    conditions: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // ── Product form ──
  const [formData, setFormData] = useState({
    name: "", description: "", price: 0, stock: 0,
    category: "Polera" as ProductCategory,
    images: [""], active: true, featured: false,
    sizes: { S: 0, M: 0, L: 0, XL: 0 } as Record<string, number>,
    measurements: {} as Record<string, Record<string, string>>,
  });

  // ── Stats ──
  const totalRevenue = orders.filter(o => o.status === "paid").reduce((a, o) => a + o.total, 0);
  const paidCount = orders.filter(o => o.status === "paid").length;
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const activeProducts = products.filter(p => p.active).length;

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [{ data: pData }, { data: oData }, { data: uData }, { data: subData }, { data: sData }] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("users").select("*"),
        supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }),
        supabase.from("shipping_settings").select("*").limit(1).single(),
      ]);
      setProducts((pData || []) as Product[]);
      setOrders((oData || []) as Order[]);
      setUsers(uData || []);
      setSubscribers(subData || []);
      if (sData) setShippingSettings(sData as ShippingSettings);
      await fetchBlogPosts();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Blog ──
  const fetchBlogPosts = async () => {
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setBlogPosts((data || []) as BlogPost[]);
  };

  const generateSlug = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const savePost = async () => {
    if (!blogForm.title || !blogForm.slug) { toast.error("Título y slug son obligatorios"); return; }
    setSavingPost(true);
    const { error } = editingPost
      ? await supabase.from("blog_posts").update(blogForm).eq("id", editingPost.id)
      : await supabase.from("blog_posts").insert(blogForm);
    if (error) toast.error("Error: " + error.message);
    else { toast.success(editingPost ? "Artículo actualizado" : "Artículo creado"); setShowBlogForm(false); fetchBlogPosts(); }
    setSavingPost(false);
  };

  const deletePost = async (id: string) => {
    if (!confirm("¿Eliminar este artículo?")) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    toast.success("Artículo eliminado"); fetchBlogPosts();
  };

  const togglePublish = async (post: BlogPost) => {
    await supabase.from("blog_posts").update({ published: !post.published }).eq("id", post.id);
    fetchBlogPosts();
  };

  // ── Products ──
  const handleCategoryChange = (category: ProductCategory) => {
    const sizes: Record<string, number> =
      ["Polera", "Poleron", "Pantalon", "Short"].includes(category) ? { S: 0, M: 0, L: 0, XL: 0 }
      : category === "Gorro" ? { "Talla Única": 0 } : {};
    const measurements: Record<string, Record<string, string>> = {};
    Object.keys(sizes).forEach(size => {
      if (["Polera", "Poleron"].includes(category)) measurements[size] = { Ancho: "", Largo: "", Hombros: "" };
      else if (category === "Pantalon") measurements[size] = { Cintura: "", Cadera: "", Largo: "" };
      else if (category === "Short") measurements[size] = { Cintura: "", Largo: "" };
    });
    setFormData(f => ({ ...f, category, sizes, stock: 0, measurements }));
  };

  const handleSizeChange = (size: string, value: number) => {
    const newSizes = { ...formData.sizes, [size]: value };
    setFormData(f => ({ ...f, sizes: newSizes, stock: Object.values(newSizes).reduce((a, v) => a + (Number(v) || 0), 0) }));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() ?? "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = formData.images[0];
      if (selectedFile) imageUrl = await uploadImage(selectedFile);
      const payload = {
        ...formData,
        images: [imageUrl],
        stock: formData.category === "Accesorio"
          ? formData.stock
          : Object.values(formData.sizes).reduce((a, v) => a + (Number(v) || 0), 0),
      };
      const { error } = editingProduct
        ? await supabase.from("products").update(payload).eq("id", editingProduct.id)
        : await supabase.from("products").insert({ ...payload, created_at: new Date().toISOString() });
      if (error) throw error;
      toast.success(editingProduct ? "Producto actualizado" : "Producto creado");
      closeProductModal();
      fetchAll();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const closeProductModal = () => {
    setShowModal(false); setEditingProduct(null); setSelectedFile(null);
    setFormData({ name: "", description: "", price: 0, stock: 0, category: "Polera", images: [""], active: true, featured: false, sizes: { S: 0, M: 0, L: 0, XL: 0 }, measurements: {} });
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({ name: p.name, description: p.description, price: p.price, stock: p.stock, category: p.category, images: p.images, active: p.active, featured: p.featured ?? false, sizes: p.sizes || {}, measurements: p.measurements || {} });
    setShowModal(true);
  };

  const toggleProductField = async (id: string, field: "active" | "featured", current: boolean) => {
    await supabase.from("products").update({ [field]: !current }).eq("id", id);
    setProducts(ps => ps.map(p => p.id === id ? { ...p, [field]: !current } : p));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteId);
    if (error) toast.error("Error al eliminar");
    else { toast.success("Producto eliminado"); setDeleteId(null); fetchAll(); }
  };

  // ── Orders ──
  const markShipped = async (orderId: string) => {
    await supabase.from("orders").update({ status: "shipped" }).eq("id", orderId);
    setOrders(os => os.map(o => o.id === orderId ? { ...o, status: "shipped" } : o));
    toast.success("Marcado como enviado");
  };

  const clearAllOrders = async () => {
    const { error } = await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      toast.error("Error al borrar: " + error.message);
      console.error("clearAllOrders:", error);
    } else {
      toast.success("Ventas borradas");
      setOrders([]);
      setShowClearOrdersModal(false);
    }
  };

  // ── Users ──
  const toggleAdmin = async (userId: string, current: string) => {
    const newRole = current === "admin" ? "user" : "admin";
    await supabase.from("users").update({ role: newRole }).eq("id", userId);
    toast.success(`Rol → ${newRole}`); fetchAll();
  };

  // ── Shipping ──
  const saveShipping = async () => {
    setSavingSettings(true);
    const { error } = await supabase.from("shipping_settings").upsert(shippingSettings);
    if (error) toast.error("Error al guardar"); else toast.success("Configuración guardada");
    setSavingSettings(false);
  };

  // ── CSV Export ──
  const exportSubscribersCSV = () => {
    const csv = ["Email,Fecha", ...subscribers.map(s => `${s.email},${new Date(s.created_at).toLocaleDateString()}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "suscriptores.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: "bg-green-100 text-green-700",
      shipped: "bg-blue-100 text-blue-700",
      pending: "bg-amber-100 text-amber-700",
    };
    const labels: Record<string, string> = { paid: "Pagado", shipped: "Enviado", pending: "Pendiente" };
    return (
      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
        {labels[status] ?? status}
      </span>
    );
  };

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin text-court-olive" size={40} /></div>;

  const TABS: { key: Tab; label: string }[] = [
    { key: "products", label: "Productos" },
    { key: "orders", label: "Ventas" },
    { key: "stock", label: "Inventario" },
    { key: "subscribers", label: "Suscriptores" },
    { key: "users", label: "Usuarios" },
    { key: "settings", label: "Configuración" },
    { key: "blog", label: "El Raquetero" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-8 py-12">

      {/* ── HEADER ── */}
      <div className="flex justify-between items-end mb-12">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-court-olive mb-2">Panel</p>
          <h1 className="text-6xl font-serif italic tracking-tighter leading-none">Admin</h1>
        </div>
        {activeTab === "products" && (
          <button onClick={() => setShowModal(true)} className="bg-court-ink text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-court-olive transition-all flex items-center gap-2">
            <Plus size={14} /> Nuevo Producto
          </button>
        )}
        {activeTab === "blog" && (
          <button onClick={() => { setEditingPost(null); setBlogForm({ title: "", slug: "", excerpt: "", content: "", cover_image: "", category: "Cultura", author: "CeroCuarenta", published: false }); setShowBlogForm(true); }}
            className="bg-court-olive text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-court-ink transition-all flex items-center gap-2">
            <Plus size={14} /> Nuevo Artículo
          </button>
        )}
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {[
          { label: "Ingresos", value: `$${totalRevenue.toLocaleString("es-CL")}`, icon: TrendingUp, color: "text-court-olive" },
          { label: "Pagados", value: paidCount, icon: CheckCircle2, color: "text-green-600" },
          { label: "Pendientes", value: pendingCount, icon: ShoppingCart, color: "text-amber-600" },
          { label: "Productos", value: activeProducts, icon: Package, color: "text-court-ink" },
          { label: "Suscriptores", value: subscribers.length, icon: Mail, color: "text-blue-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-court-ink/40">{label}</p>
              <Icon size={14} className={color} />
            </div>
            <p className="text-2xl font-serif italic">{value}</p>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-6 mb-10 border-b border-gray-100 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`pb-4 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === key ? "text-court-olive border-b-2 border-court-olive" : "text-court-ink/30 hover:text-court-ink"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════ PRODUCTOS ══════════════ */}
      {activeTab === "products" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 text-[9px] font-bold uppercase tracking-widest text-court-ink/40">
                  <th className="px-6 py-4">Pieza</th>
                  <th className="px-6 py-4">Cat.</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Destacado</th>
                  <th className="px-6 py-4">Activo</th>
                  <th className="px-6 py-4">Acc.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={p.images[0]} alt={p.name} className="w-10 h-14 rounded-lg object-cover flex-shrink-0" />
                        <span className="font-serif italic text-base leading-tight">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-court-ink/40">{p.category}</td>
                    <td className="px-6 py-4 font-bold text-sm">${p.price.toLocaleString("es-CL")}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${p.stock <= 3 ? "text-red-500" : "text-court-ink"}`}>{p.stock}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Toggle value={p.featured ?? false} onChange={() => toggleProductField(p.id, "featured", p.featured ?? false)} />
                    </td>
                    <td className="px-6 py-4">
                      <Toggle value={p.active} onChange={() => toggleProductField(p.id, "active", p.active)} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(p)} className="p-2 text-court-olive hover:text-court-ink transition-colors"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-16 text-center text-court-ink/30 font-serif italic">Sin productos todavía.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════ VENTAS ══════════════ */}
      {activeTab === "orders" && (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Row */}
              <button
                onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                className="w-full flex items-center gap-6 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{o.shipping_address?.full_name || "Invitado"}</p>
                  <p className="text-[10px] text-court-ink/40">{o.customer_email}</p>
                </div>
                <div className="text-right hidden md:block">
                  <p className="font-bold text-sm">${o.total.toLocaleString("es-CL")}</p>
                  <p className="text-[10px] text-court-ink/30">{o.created_at ? new Date(o.created_at).toLocaleDateString("es-CL") : ""}</p>
                </div>
                <div>{statusBadge(o.status)}</div>
                {expandedOrder === o.id ? <ChevronUp size={16} className="text-court-ink/30 flex-shrink-0" /> : <ChevronDown size={16} className="text-court-ink/30 flex-shrink-0" />}
              </button>

              {/* Expanded detail */}
              {expandedOrder === o.id && (
                <div className="border-t border-gray-100 px-6 py-6 bg-gray-50 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Items */}
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-3">Productos</p>
                      <div className="space-y-2">
                        {(o.items || []).map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2">
                            {item.images?.[0] && <img src={item.images[0]} alt="" className="w-8 h-10 rounded-lg object-cover flex-shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate">{item.name}</p>
                              <p className="text-[9px] text-court-ink/40">Talla {item.selectedSize} · x{item.quantity}</p>
                            </div>
                            <p className="text-xs font-bold text-court-olive flex-shrink-0">${(item.price * item.quantity).toLocaleString("es-CL")}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Address */}
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-3">Dirección de envío</p>
                      <div className="bg-white rounded-xl px-4 py-3 text-sm space-y-1">
                        <p className="font-bold">{o.shipping_address?.full_name}</p>
                        <p className="text-court-ink/60">{o.shipping_address?.street} {o.shipping_address?.street_number}{o.shipping_address?.apartment ? `, ${o.shipping_address.apartment}` : ""}</p>
                        <p className="text-court-ink/60">{o.shipping_address?.commune}, {o.shipping_address?.region}</p>
                        <p className="text-court-ink/40 text-xs">{o.shipping_address?.phone}</p>
                        {o.shipping_address?.notes && <p className="text-court-ink/40 text-xs italic">"{o.shipping_address.notes}"</p>}
                      </div>
                      {o.payment_id && (
                        <p className="text-[9px] text-court-ink/30 mt-2 font-mono">MP: {o.payment_id}</p>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2">
                    {o.status !== "shipped" && o.status === "paid" && (
                      <button onClick={() => markShipped(o.id)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">
                        <Truck size={12} /> Marcar como Enviado
                      </button>
                    )}
                    <p className="text-[9px] text-court-ink/30 font-mono truncate">ID: {o.id}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          {orders.length === 0 && (
            <div className="text-center py-20 text-court-ink/30 font-serif italic">Sin pedidos todavía.</div>
          )}
          {orders.length > 0 && (
            <div className="pt-4 flex justify-end">
              <button onClick={() => setShowClearOrdersModal(true)} className="text-[10px] font-bold uppercase tracking-widest text-red-400 border border-red-200 px-5 py-2.5 rounded-full hover:bg-red-50 transition-all">
                Borrar todas las ventas
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════ INVENTARIO ══════════════ */}
      {activeTab === "stock" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                {["Producto", "Categoría", "Tallas / Stock", "Total"].map(h => (
                  <th key={h} className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-court-ink/40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <span className="text-sm font-bold">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-court-ink/40">{p.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(p.sizes || {}).map(([size, count]) => (
                        <span key={size} className={`text-[9px] font-bold px-2 py-1 rounded-full border ${Number(count) === 0 ? "border-red-200 text-red-500 bg-red-50" : "border-court-olive/20 text-court-olive bg-court-olive/5"}`}>
                          {size}: {count}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-bold ${p.stock <= 5 ? "text-red-500" : "text-court-ink"}`}>{p.stock}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════ SUSCRIPTORES ══════════════ */}
      {activeTab === "subscribers" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40">{subscribers.length} suscriptores</p>
            <button onClick={exportSubscribersCSV} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest border border-court-olive text-court-olive px-5 py-2.5 rounded-full hover:bg-court-olive hover:text-white transition-all">
              <Download size={12} /> Exportar CSV
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-court-ink/40">Email</th>
                  <th className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-court-ink/40">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subscribers.map(s => (
                  <tr key={s.email} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium">{s.email}</td>
                    <td className="px-6 py-4 text-[10px] text-court-ink/40">{new Date(s.created_at).toLocaleDateString("es-CL")}</td>
                  </tr>
                ))}
                {subscribers.length === 0 && (
                  <tr><td colSpan={2} className="px-6 py-16 text-center text-court-ink/30 font-serif italic">Sin suscriptores todavía.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════ USUARIOS ══════════════ */}
      {activeTab === "users" && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                {["Usuario", "Email", "Rol", "Acciones"].map(h => (
                  <th key={h} className="px-6 py-4 text-[9px] font-bold uppercase tracking-widest text-court-ink/40">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-court-olive/10 rounded-full flex items-center justify-center text-court-olive"><Users size={14} /></div>
                      <span className="font-bold text-sm">{u.display_name || "—"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-court-ink/60">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${u.role === "admin" ? "bg-court-olive text-white" : "bg-gray-100 text-gray-500"}`}>
                      {u.role || "user"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleAdmin(u.id, u.role || "user")} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-court-olive hover:text-court-ink transition-all">
                      {u.role === "admin" ? <ShieldCheck size={13} /> : <UserCheck size={13} />}
                      {u.role === "admin" ? "Quitar Admin" : "Hacer Admin"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════ CONFIGURACIÓN ══════════════ */}
      {activeTab === "settings" && (
        <div className="max-w-2xl bg-white rounded-2xl border border-gray-100 p-10 shadow-sm">
          <div className="flex items-center gap-3 mb-10">
            <Settings size={20} className="text-court-olive" />
            <h2 className="text-xl font-serif italic">Configuración de Envío</h2>
          </div>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Precio RM (Santiago)", key: "rm" as const },
                { label: "Precio Regiones", key: "region" as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">{label}</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-court-ink/40 font-bold text-sm">$</span>
                    <input type="number" className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-court-olive outline-none transition-all font-bold text-sm"
                      value={shippingSettings[key].price}
                      onChange={e => setShippingSettings(s => ({ ...s, [key]: { ...s[key], price: parseInt(e.target.value) || 0 } }))} />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Umbral Envío Gratis (0 = desactivado)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-court-ink/40 font-bold text-sm">$</span>
                <input type="number" className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-court-olive outline-none transition-all font-bold text-sm"
                  value={shippingSettings.free_shipping_threshold}
                  onChange={e => setShippingSettings(s => ({ ...s, free_shipping_threshold: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Condiciones</label>
              <textarea rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-court-olive outline-none transition-all text-sm resize-none"
                value={shippingSettings.conditions}
                onChange={e => setShippingSettings(s => ({ ...s, conditions: e.target.value }))} />
            </div>
            <button onClick={saveShipping} disabled={savingSettings}
              className="w-full flex items-center justify-center gap-2 bg-court-ink text-white py-4 rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-court-olive transition-all disabled:opacity-50">
              {savingSettings ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Guardar Cambios
            </button>
          </div>
        </div>
      )}

      {/* ══════════════ BLOG ══════════════ */}
      {activeTab === "blog" && (
        <div>
          {showBlogForm && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-8 shadow-sm">
              <h3 className="text-xl font-serif italic mb-6">{editingPost ? "Editar Artículo" : "Nuevo Artículo"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Título *</label>
                  <input type="text" value={blogForm.title ?? ""} placeholder="Game, Set and Moda"
                    onChange={e => setBlogForm(f => ({ ...f, title: e.target.value, slug: editingPost ? f.slug : generateSlug(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-court-olive/20" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Slug *</label>
                  <input type="text" value={blogForm.slug ?? ""}
                    onChange={e => setBlogForm(f => ({ ...f, slug: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-court-olive/20" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Categoría</label>
                  <select value={blogForm.category ?? "Cultura"} onChange={e => setBlogForm(f => ({ ...f, category: e.target.value as BlogCategory }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-court-olive/20">
                    {["Cultura", "Tennis", "Moda", "Drops", "Noticias"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Autor</label>
                  <input type="text" value={blogForm.author ?? ""} onChange={e => setBlogForm(f => ({ ...f, author: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-court-olive/20" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">URL Portada</label>
                  <input type="text" value={blogForm.cover_image ?? ""} placeholder="https://..."
                    onChange={e => setBlogForm(f => ({ ...f, cover_image: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-court-olive/20" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Extracto</label>
                  <textarea rows={2} value={blogForm.excerpt ?? ""} onChange={e => setBlogForm(f => ({ ...f, excerpt: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-court-olive/20" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Contenido (Markdown)</label>
                  <textarea rows={14} value={blogForm.content ?? ""}
                    onChange={e => setBlogForm(f => ({ ...f, content: e.target.value }))}
                    placeholder={"## Sección\n\nTexto del artículo. Soporta **negrita**, *cursiva*, listas, ![img](url)"}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-court-olive/20" />
                  <p className="text-[9px] text-court-ink/30 mt-1">Soporta Markdown: **negrita**, *cursiva*, # Títulos, - listas</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Toggle value={blogForm.published ?? false} onChange={v => setBlogForm(f => ({ ...f, published: v }))} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-court-ink/50">{blogForm.published ? "Publicado" : "Borrador"}</span>
                </label>
                <div className="flex gap-3">
                  <button onClick={() => setShowBlogForm(false)} className="px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-all">Cancelar</button>
                  <button onClick={savePost} disabled={savingPost} className="bg-court-olive text-white px-8 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-court-ink transition-all flex items-center gap-2 disabled:opacity-50">
                    {savingPost ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {editingPost ? "Actualizar" : "Publicar"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {blogPosts.length === 0 && !showBlogForm ? (
            <div className="text-center py-20 border-2 border-dashed border-court-olive/10 rounded-2xl">
              <FileText size={28} className="text-court-olive/20 mx-auto mb-3" />
              <p className="font-serif italic text-xl text-court-ink/30">Sin artículos todavía.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {blogPosts.map((post, i) => (
                <div key={post.id} className={`flex items-center gap-5 px-6 py-4 ${i !== blogPosts.length - 1 ? "border-b border-gray-100" : ""}`}>
                  {post.cover_image && (
                    <img src={post.cover_image} alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{post.title}</p>
                    <p className="text-[9px] text-court-ink/40 font-bold uppercase tracking-widest">{post.category} · /raquetero/{post.slug}</p>
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full flex-shrink-0 ${post.published ? "bg-court-olive/10 text-court-olive" : "bg-gray-100 text-gray-400"}`}>
                    {post.published ? "Publicado" : "Borrador"}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => togglePublish(post)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-court-ink/40 hover:text-court-olive transition-all">
                      {post.published ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => { setEditingPost(post); setBlogForm({ ...post }); setShowBlogForm(true); }}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-court-ink/40 hover:text-court-olive transition-all">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deletePost(post.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-court-ink/40 hover:text-red-500 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ MODALS ══════════════ */}

      {/* Delete product */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><Trash2 size={24} /></div>
            <h3 className="text-xl font-serif italic mb-3">¿Eliminar pieza?</h3>
            <p className="text-sm text-court-ink/40 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-200 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 text-white py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-600">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Clear orders */}
      {showClearOrdersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500"><ShoppingCart size={24} /></div>
            <h3 className="text-xl font-serif italic mb-3">¿Borrar todas las ventas?</h3>
            <p className="text-sm text-court-ink/40 mb-6">Se eliminará todo el historial de pedidos permanentemente.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearOrdersModal(false)} className="flex-1 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest border border-gray-200 hover:bg-gray-50">Cancelar</button>
              <button onClick={clearAllOrders} className="flex-1 bg-red-500 text-white py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-600">Borrar Todo</button>
            </div>
          </div>
        </div>
      )}

      {/* Product modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-2xl my-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-serif italic">{editingProduct ? "Editar Pieza" : "Nueva Pieza"}</h2>
              <button onClick={closeProductModal} className="text-court-ink/30 hover:text-court-ink transition-colors"><Plus className="rotate-45" size={22} /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Nombre</label>
                  <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-court-olive outline-none transition-all"
                    value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Descripción</label>
                  <textarea rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-court-olive outline-none transition-all resize-none"
                    value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Precio (CLP)</label>
                  <input type="number" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-court-olive outline-none transition-all"
                    value={formData.price} onChange={e => setFormData(f => ({ ...f, price: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Categoría</label>
                  <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-court-olive outline-none transition-all"
                    value={formData.category} onChange={e => handleCategoryChange(e.target.value as ProductCategory)}>
                    {["Polera", "Poleron", "Pantalon", "Short", "Gorro", "Accesorio"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Toggle value={formData.active} onChange={v => setFormData(f => ({ ...f, active: v }))} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-court-ink/50">Activo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Toggle value={formData.featured} onChange={v => setFormData(f => ({ ...f, featured: v }))} />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-court-ink/50 flex items-center gap-1"><Star size={10} className="text-amber-500" /> Destacado</span>
                  </label>
                </div>

                {/* Sizes */}
                {formData.category !== "Accesorio" && Object.keys(formData.sizes).length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-3">Stock por Talla</label>
                    <div className="grid grid-cols-4 gap-3">
                      {Object.entries(formData.sizes).map(([size, stock]) => (
                        <div key={size}>
                          <label className="block text-[8px] font-bold uppercase tracking-widest text-court-ink/30 mb-1">{size}</label>
                          <input type="number" min="0"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-court-olive outline-none text-sm text-center"
                            value={stock} onChange={e => handleSizeChange(size, Number(e.target.value))} />
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[9px] text-court-ink/40">Total: <strong className="text-court-ink">{formData.stock}</strong></p>
                  </div>
                )}

                {formData.category === "Accesorio" && (
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Stock Total</label>
                    <input type="number" min="0" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-court-olive outline-none"
                      value={formData.stock} onChange={e => setFormData(f => ({ ...f, stock: Number(e.target.value) }))} />
                  </div>
                )}

                {/* Measurements */}
                {Object.keys(formData.measurements).length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-3">Guía de Medidas (cm)</label>
                    <div className="space-y-4">
                      {Object.keys(formData.sizes).map(size => (
                        <div key={size} className="bg-gray-50 rounded-xl p-4">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-court-olive mb-3">Talla {size}</p>
                          <div className="grid grid-cols-3 gap-3">
                            {Object.keys(formData.measurements[size] || {}).map(key => (
                              <div key={key}>
                                <label className="block text-[8px] font-bold uppercase tracking-widest text-court-ink/30 mb-1">{key}</label>
                                <input type="text" placeholder="52"
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-court-olive text-xs"
                                  value={formData.measurements[size]?.[key] ?? ""}
                                  onChange={e => setFormData(f => ({ ...f, measurements: { ...f.measurements, [size]: { ...f.measurements[size], [key]: e.target.value } } }))} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image */}
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-court-ink/40 mb-2">Imagen</label>
                  <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && setSelectedFile(e.target.files[0])} className="hidden" id="img-upload" />
                  <label htmlFor="img-upload"
                    className="flex items-center justify-center gap-3 w-full h-24 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-court-olive transition-colors">
                    {selectedFile ? (
                      <><ImageIcon size={18} className="text-court-olive" /><span className="text-[10px] font-bold uppercase tracking-widest truncate max-w-xs">{selectedFile.name}</span></>
                    ) : formData.images[0] ? (
                      <><img src={formData.images[0]} alt="" className="w-8 h-10 rounded-lg object-cover" /><span className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40">Cambiar imagen</span></>
                    ) : (
                      <><Upload size={18} className="text-gray-300" /><span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">Subir imagen</span></>
                    )}
                  </label>
                  <p className="text-[9px] text-court-ink/30 mt-1">Requiere bucket <code className="bg-gray-100 px-1 rounded">product-images</code> en Supabase Storage (público)</p>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={closeProductModal} className="text-[10px] font-bold uppercase tracking-widest text-court-ink/40 hover:text-court-ink py-3 px-6">Cancelar</button>
                <button type="submit" disabled={uploading}
                  className="bg-court-olive text-white px-10 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-court-ink transition-all disabled:opacity-50 flex items-center gap-2">
                  {uploading ? <><Loader2 className="animate-spin" size={14} /> Subiendo...</> : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
