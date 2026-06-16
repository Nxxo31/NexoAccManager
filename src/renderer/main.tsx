import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import i18next from 'i18next';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enJson from './locales/en.json';
import esJson from './locales/es.json';
import ptJson from './locales/pt.json';

// Function to get stored language from Electron settings
async function getStoredLanguage(): Promise<string | null> {
  try {
    // @ts-ignore: window.api is exposed via preload
    const result = await window.api.settings.get('language');
    return result as string;
  } catch (e) {
    console.warn('Failed to get stored language:', e);
    return null;
  }
}

// Initialize i18next with language from storage or detector
async function initI18next() {
  const storedLang = await getStoredLanguage();
  const lng = storedLang ?? undefined; // if undefined, LanguageDetector will detect
  
  await i18next
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: enJson },
        es: { translation: esJson },
        pt: { translation: ptJson },
      },
      lng: lng,
      fallbackLng: 'es',
      detection: {
        order: ['navigator', 'localStorage', 'path', 'subdomain'],
        caches: ['localStorage'],
      },
      interpolation: {
        escapeValue: false,
      },
    });
  
  // If we detected a language (no stored), store it for next launch
  if (!storedLang) {
    const detectedLng = i18next.language;
    try {
      // @ts-ignore: window.api is exposed via preload
      window.api.settings.set('language', detectedLng);
    } catch (e) {
      console.warn('Failed to store detected language:', e);
    }
  }
}

// Render app after i18next is initialized
async function render() {
  await initI18next();
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <I18nextProvider i18n={i18next}>
        <App />
      </I18nextProvider>
    </React.StrictMode>
  );
}

render();