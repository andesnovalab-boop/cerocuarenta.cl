import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User, Search, Menu, X, Package, LogOut, LayoutDashboard } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";

export const Navbar: React.FC = () => {
  const { cart } = useCart();
  const { session, isAdmin, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-5 md:py-6">
      <div className="max-w-[1800px] mx-auto grid grid-cols-[1fr_auto_1fr] items-center">

        {/* Left: Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-[11px] font-bold uppercase tracking-[3px] text-court-ink hover:text-court-olive transition-colors">
            Colección
          </Link>
          <Link to="/galeria" className="text-[11px] font-bold uppercase tracking-[3px] text-court-ink hover:text-court-olive transition-colors">
            Galería
          </Link>
          <Link to="/club" className="text-[11px] font-bold uppercase tracking-[3px] text-court-ink hover:text-court-olive transition-colors">
            El Club
          </Link>
          <Link to="/raquetero" className="text-[11px] font-bold uppercase tracking-[3px] text-white bg-court-ink px-4 py-2 rounded-full hover:bg-court-olive transition-colors">
            El Raquetero
          </Link>
        </div>

        {/* Mobile: Hamburger */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMenuOpen}
            className="text-court-ink p-1"
          >
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Center: Logo */}
        <div className="flex justify-center">
          <Link to="/">
            <img
              src="/images/logo.png"
              alt="CeroCuarenta"
              className="h-8 md:h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-4 md:gap-5">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="text-court-ink hover:text-court-olive transition-colors p-1"
            aria-label="Buscar"
          >
            <Search size={18} strokeWidth={1.5} />
          </button>

          {/* Cart */}
          <Link to="/cart" className="relative text-court-ink hover:text-court-olive transition-colors p-2" aria-label="Carrito">
            <ShoppingCart size={20} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-court-olive text-white text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white px-1">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Menu */}
          {session ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="text-court-ink hover:text-court-olive transition-colors p-2"
                aria-label="Mi cuenta"
              >
                <User size={20} strokeWidth={1.5} />
              </button>
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-3 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-black/5 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-court-ink/40">Mi Cuenta</p>
                      <p className="text-[11px] font-bold text-court-ink truncate mt-0.5">{session.user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-court-ink hover:text-court-olive hover:bg-court-olive/5 transition-colors"
                      >
                        <Package size={14} />
                        Mis Pedidos
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-court-olive hover:bg-court-olive/5 transition-colors"
                        >
                          <LayoutDashboard size={14} />
                          Panel Admin
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} />
                        Cerrar Sesión
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link to="/login" className="text-court-ink hover:text-court-olive transition-colors p-1" aria-label="Ingresar">
              <User size={20} strokeWidth={1.5} />
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="hidden lg:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-court-olive bg-court-olive/5 px-3 py-1.5 rounded-full border border-court-olive/20 hover:bg-court-olive hover:text-white transition-all"
            >
              <LayoutDashboard size={11} />
              Admin
            </Link>
          )}
        </div>
      </div>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-0 right-0 top-full bg-white border-b border-gray-100 p-6 shadow-xl z-50"
          >
            <form onSubmit={handleSearch} className="max-w-xl mx-auto relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-court-ink/30" size={16} />
              <input
                autoFocus
                type="text"
                placeholder="BUSCAR EN LA COLECCIÓN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-court-olive/5 border border-court-olive/10 rounded-full pl-12 pr-6 py-4 text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-court-olive/20 focus:border-court-olive transition-all"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Cerrar búsqueda"
                className="absolute right-5 top-1/2 -translate-y-1/2 text-court-ink/30 hover:text-court-ink transition-colors"
              >
                <X size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden absolute left-0 right-0 top-full z-50 shadow-xl"
          >
            <div className="flex flex-col px-8 py-10 gap-6">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-[13px] font-bold uppercase tracking-[4px] text-court-ink">Colección</Link>
              <Link to="/galeria" onClick={() => setIsMenuOpen(false)} className="text-[13px] font-bold uppercase tracking-[4px] text-court-ink">Galería</Link>
              <Link to="/club" onClick={() => setIsMenuOpen(false)} className="text-[13px] font-bold uppercase tracking-[4px] text-court-ink">El Club</Link>
              <Link to="/raquetero" onClick={() => setIsMenuOpen(false)} className="text-[13px] font-bold uppercase tracking-[4px] text-court-ink">El Raquetero</Link>

              <div className="h-px bg-gray-100 w-full my-2" />

              {session ? (
                <>
                  <Link to="/orders" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[3px] text-court-ink">
                    <Package size={16} /> Mis Pedidos
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[3px] text-court-olive">
                      <LayoutDashboard size={16} /> Admin Panel
                    </Link>
                  )}
                  <button onClick={handleSignOut} className="flex items-center gap-3 text-left text-[11px] font-bold uppercase tracking-[3px] text-red-500">
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[3px] text-court-olive">
                  <User size={16} /> Ingresar / Registrarse
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
