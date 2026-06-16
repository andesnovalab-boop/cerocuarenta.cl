import React from "react";
import { SEO } from "../components/SEO";

export const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-8 py-24 bg-court-cream min-h-screen">
      <SEO title="Términos y Condiciones" />
      <h1 className="text-5xl font-bitter italic mb-12">Términos y Condiciones</h1>
      <div className="prose prose-court-ink max-w-none space-y-8 text-court-ink/70">
        <section>
          <h2 className="text-xl font-bold uppercase tracking-widest text-court-ink mb-4">1. Introducción</h2>
          <p>Bienvenido a CeroCuarenta. Al acceder y utilizar nuestro sitio web, aceptas cumplir con los siguientes términos y condiciones. Por favor, léelos detenidamente.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold uppercase tracking-widest text-court-ink mb-4">2. Propiedad Intelectual</h2>
          <p>Todo el contenido de este sitio, incluyendo textos, gráficos, logos e imágenes, es propiedad de CeroCuarenta y está protegido por las leyes de propiedad intelectual de Chile.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold uppercase tracking-widest text-court-ink mb-4">3. Envíos</h2>
          <p>Realizamos envíos a todo Chile a través de servicios de courier externos. Los tiempos de entrega son estimados y pueden variar según la región.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold uppercase tracking-widest text-court-ink mb-4">4. Devoluciones</h2>
          <p>Tienes un plazo de 10 días para solicitar cambios o devoluciones, siempre que el producto esté en perfectas condiciones y con sus etiquetas originales.</p>
        </section>
      </div>
    </div>
  );
};

export const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-8 py-24 bg-court-cream min-h-screen">
      <SEO title="Política de Privacidad" />
      <h1 className="text-5xl font-bitter italic mb-12">Política de Privacidad</h1>
      <div className="prose prose-court-ink max-w-none space-y-8 text-court-ink/70">
        <p>En CeroCuarenta, nos tomamos muy en serio la privacidad de tus datos. Esta política describe cómo recopilamos y utilizamos tu información personal.</p>
        <section>
          <h2 className="text-xl font-bold uppercase tracking-widest text-court-ink mb-4">Datos Recopilados</h2>
          <p>Recopilamos información como tu nombre, email, RUT y dirección de envío únicamente para procesar tus pedidos y mejorar tu experiencia de compra.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold uppercase tracking-widest text-court-ink mb-4">Seguridad</h2>
          <p>Tus datos de pago son procesados de forma segura a través de Flow, y nunca almacenamos los detalles de tus tarjetas de crédito en nuestros servidores.</p>
        </section>
      </div>
    </div>
  );
};
