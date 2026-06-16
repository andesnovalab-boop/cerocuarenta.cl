import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

type Mode = "login" | "register" | "forgot";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) navigate("/");
  }, [session, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) throw error;
        toast.success("Revisa tu email para restablecer tu contraseña.");
        setMode("login");
        return;
      }

      if (mode === "register") {
        if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: displayName } },
        });
        if (error) throw error;
        if (data.user) {
          await supabase.from("users").upsert({
            id: data.user.id,
            email,
            display_name: displayName,
            role: "customer",
          });
        }
        toast.success("Cuenta creada. Verifica tu email para activarla.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("¡Bienvenido de vuelta!");
        navigate("/");
      }
    } catch (error: any) {
      const msg = error.message === "Invalid login credentials"
        ? "Email o contraseña incorrectos"
        : error.message;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) toast.error("Error al iniciar sesión con Google: " + error.message);
  };

  const titles: Record<Mode, string> = {
    login: "Bienvenido",
    register: "Crear Cuenta",
    forgot: "Recuperar Contraseña",
  };

  const subtitles: Record<Mode, string> = {
    login: "Accede a tu cuenta del Club",
    register: "Únete al Club CeroCuarenta",
    forgot: "Te enviaremos un enlace a tu email",
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 bg-gray-50 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-court-ink/40 hover:text-court-ink mb-10 transition-colors">
          <ArrowLeft size={14} /> Volver a la tienda
        </Link>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-black/5 p-10">
          <div className="text-center mb-8">
            <Link to="/" className="text-3xl font-bitter italic text-court-olive">CeroCuarenta</Link>
            <h1 className="text-2xl font-bold text-court-ink mt-4 mb-1">{titles[mode]}</h1>
            <p className="text-[11px] text-court-ink/40 font-medium uppercase tracking-widest">{subtitles[mode]}</p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "register" && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-court-ink/30" size={16} />
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-court-olive/20 focus:border-court-olive transition-all"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-court-ink/30" size={16} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-court-olive/20 focus:border-court-olive transition-all"
                required
              />
            </div>

            {mode !== "forgot" && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-court-ink/30" size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-court-olive/20 focus:border-court-olive transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-court-ink/30 hover:text-court-ink transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            )}

            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode("forgot")}
                  className="text-[11px] font-bold text-court-olive hover:text-court-ink transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-court-ink text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-court-olive transition-all shadow-lg shadow-court-ink/10 disabled:opacity-50 text-[12px]"
            >
              {loading
                ? "Procesando..."
                : mode === "login"
                ? "Ingresar"
                : mode === "register"
                ? "Crear Cuenta"
                : "Enviar Enlace"}
            </button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-court-ink/30">O</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-court-ink py-4 rounded-xl font-bold uppercase tracking-widest hover:border-gray-300 hover:bg-gray-50 transition-all text-[12px] shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar con Google
              </button>
            </>
          )}

          <div className="mt-8 text-center">
            {mode === "login" ? (
              <p className="text-[12px] text-court-ink/50">
                ¿No tienes cuenta?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="font-bold text-court-olive hover:text-court-ink transition-colors"
                >
                  Regístrate gratis
                </button>
              </p>
            ) : (
              <button
                onClick={() => setMode("login")}
                className="text-[12px] font-bold text-court-olive hover:text-court-ink transition-colors"
              >
                ← Volver a Iniciar Sesión
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-court-ink/30 font-bold uppercase tracking-widest mt-8">
          Seguro · Rápido · Exclusivo
        </p>
      </div>
    </div>
  );
};
