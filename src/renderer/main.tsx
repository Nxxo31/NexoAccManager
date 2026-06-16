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

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enJson },
      es: { translation: esJson },
      pt: { translation: ptJson },
    },
    fallbackLng: 'es',
    detection: {
      order: ['navigator', 'localStorage', 'path', 'subdomain'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18next}>
      <App />
    </I18nextProvider>
  </React.StrictMode>
);