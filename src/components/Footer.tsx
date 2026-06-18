import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Mail, Phone, MapPin } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-court-ink text-white pt-16 sm:pt-32 pb-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-16 mb-16 sm:mb-32">
          {/* Brand Section */}
          <div className="space-y-8">
            <img
              src="/images/logo_blanco.png"
              alt="CeroCuarenta"
              className="h-10 w-auto object-contain"
            />
            <p className="text-white/40 text-sm leading-relaxed font-medium">
              Somos una marca chilena Inspirada en el tenis, creada para ti.
            </p>
            <div className="flex gap-6">
              <a href="https://www.instagram.com/cerocuarenta.cl/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-white/20 hover:text-court-olive transition-all"><Instagram size={20} /></a>
            </div>
          </div>

          {/* Shop Section */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-court-olive">Colección</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-all">Todos los Productos</Link></li>
              <li><Link to="/galeria" className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-all">Galería</Link></li>
              <li><Link to="/club" className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-all">El Club</Link></li>
              <li><Link to="/raquetero" className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-all">El Raquetero</Link></li>
            </ul>
          </div>

          {/* Support Section */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-court-olive">Legal</h4>
            <ul className="space-y-4">
              <li><Link to="/terms" className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-all">Términos y Condiciones</Link></li>
              <li><Link to="/privacy" className="text-white/40 hover:text-white text-xs font-bold uppercase tracking-widest transition-all">Política de Privacidad</Link></li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="space-y-8">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-court-olive">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-4 text-white/40 text-xs font-bold uppercase tracking-widest">
                <Mail size={16} className="text-court-olive" /> contacto@cerocuarenta.cl
              </li>
              <li className="text-white/40 text-xs font-bold uppercase tracking-widest">
                <a href="https://wa.me/56950081657" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 hover:text-white transition-all">
                  <Phone size={16} className="text-court-olive" /> +56 9 5008 1657
                </a>
              </li>
              <li className="flex items-center gap-4 text-white/40 text-xs font-bold uppercase tracking-widest">
                <MapPin size={16} className="text-court-olive" /> Santiago, Chile
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
            © 2026 CEROCUARENTA. TODOS LOS DERECHOS RESERVADOS.
          </p>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-[0.3em] text-white/20">
            <Link to="/terms" className="hover:text-white transition-all">Términos</Link>
            <Link to="/privacy" className="hover:text-white transition-all">Privacidad</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
