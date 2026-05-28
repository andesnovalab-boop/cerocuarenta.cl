/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { HelmetProvider } from "react-helmet-async";
import { CartProvider } from "./contexts/CartContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { CartPage } from "./pages/CartPage";
import { Checkout } from "./pages/Checkout";
import { Success } from "./pages/Success";
import { Orders } from "./pages/Orders";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ProductDetail } from "./pages/ProductDetail";
import { Lookbook } from "./pages/Lookbook";
import { Club } from "./pages/Club";
import { Terms, Privacy } from "./pages/Legal";
import { ElRaquetero } from "./pages/ElRaquetero";
import { BlogPostPage } from "./pages/BlogPostPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ScrollToTop } from "./components/ScrollToTop";
import { TennisCursor } from "./components/TennisCursor";

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <TennisCursor />
          <div className="min-h-screen bg-court-cream font-sans selection:bg-court-olive selection:text-white">
            <Navbar />
            <main className="pb-20">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/galeria" element={<Lookbook />} />
                <Route path="/club" element={<Club />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/success" element={<Success />} />
                <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
                <Route path="/raquetero" element={<ElRaquetero />} />
                <Route path="/raquetero/:slug" element={<BlogPostPage />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
              </Routes>
            </main>
            <Footer />
            <Toaster position="bottom-right" richColors />
          </div>
        </Router>
      </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
