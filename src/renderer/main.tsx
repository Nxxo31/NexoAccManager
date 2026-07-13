import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import i18next from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import enJson from './locales/en.json';
import esJson from './locales/es.json';
import ptJson from './locales/pt.json';

// Initialize i18next with resources directly — no backend, no detector
// This avoids the `t.forEach is not a function` bug that occurs when
// i18next's backend connector tries to load languages asynchronously
async function initI18next(): Promise<void> {
  // Try to get stored language from Electron settings
  let lng = 'es'; // default
  try {
    const stored = await (window as any).api?.settings?.get?.('language');
    if (typeof stored === 'string' && stored) {
      lng = stored;
    } else if (stored?.data && typeof stored.data === 'string') {
      lng = stored.data;
    }
  } catch {
    // If settings API not available, use navigator language
    const navLang = navigator.language?.split('-')[0];
    if (navLang && ['es', 'en', 'pt'].includes(navLang)) {
      lng = navLang;
    }
  }

  await i18next.use(initReactI18next).init({
    resources: {
      en: { translation: enJson },
      es: { translation: esJson },
      pt: { translation: ptJson },
    },
    lng,
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
    // Critical: disable backend loading to prevent forEach errors
    react: {
      useSuspense: false,
    },
  });
}

// Render app after i18next is initialized (with timeout fallback)
async function render(): Promise<void> {
  // Timeout: si initI18next cuelga (API call falla), renderizar de todas formas
  // después de 3s para evitar pantalla negra permanente
  const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 3000));
  await Promise.race([initI18next(), timeoutPromise]);

  const root = document.getElementById('root');
  if (!root) {
    console.error('div#root not found — cannot render React app');
    return;
  }

  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <I18nextProvider i18n={i18next}>
          <App />
        </I18nextProvider>
      </React.StrictMode>
    );
  } catch (err) {
    console.error('React render failed:', err);
    root.innerHTML = `<div style="color:#FF4757;padding:2rem;font-family:monospace">Error iniciando NexoAccManager. Revisa la consola.</div>`;
  }
}

render().catch((err) => {
  console.error('Fatal render error:', err);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<div style="color:#FF4757;padding:2rem;font-family:monospace">Error iniciando NexoAccManager. Revisa la consola.</div>';
  }
});