import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Las etiquetas SEO escritas en el HTML al compilar (data-prerender) sirven a Google y a
// WhatsApp, que leen el HTML tal como llega. En el navegador las reemplaza React Helmet
// (components/SEO.tsx); se quitan antes para que no queden duplicadas.
document.querySelectorAll('head [data-prerender]').forEach((el) => el.remove());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
