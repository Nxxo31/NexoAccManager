import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  activeView: 'accounts' | 'servers' | 'settings' | 'presence';
  onViewChange: (view: 'accounts' | 'servers' | 'settings' | 'presence') => void;
}

export default function Header({ activeView, onViewChange }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentLang = i18n.language; // 'es' | 'en' | 'pt'
  const langLabels: Record<string, string> = {
    es: '🇪🇸',
    en: '🇬🇧',
    pt: '🇵🇹',
  };

  const handleLanguageChange = async (lng: string) => {
    try {
      // @ts-ignore: window.api is exposed via preload
      await window.api.settings.set('language', lng);
      i18n.changeLanguage(lng);
    } catch (e) {
      console.error('Failed to change language:', e);
    }
    setOpen(false);
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-[#2f3640] border-b border-gray-700">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#6c5ce7] rounded-lg flex items-center justify-center font-bold text-sm">
          NX
        </div>
        <h1 className="text-lg font-semibold tracking-tight">{t('header.title')}</h1>
      </div>

      <nav className="flex gap-1">
        <button
          onClick={() => onViewChange('accounts')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'accounts' ? 'bg-[#6c5ce7] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          {t('header.navAccounts')}
        </button>
        <button
          onClick={() => onViewChange('servers')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'servers' ? 'bg-[#6c5ce7] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          {t('header.navServers')}
        </button>
        <button
          onClick={() => onViewChange('presence')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'presence' ? 'bg-[#6c5ce7] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          {t('header.navPresence')}
        </button>
        <button
          onClick={() => onViewChange('settings')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeView === 'settings' ? 'bg-[#6c5ce7] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          {t('header.navSettings')}
        </button>
      </nav>

      {/* Language selector */}
      <div className="relative inline-block">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white focus:outline-none"
          aria-label={t('languageSelector.title')}
        >
          <span>{langLabels[currentLang] || '🌐'}</span>
          {/* Dropdown indicator */}
          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-32 bg-[#2f3640] border border-gray-700 rounded-md shadow-lg z-10">
            {[ 'es', 'en', 'pt' ].map(lng => (
              <button
                key={lng}
                onClick={() => handleLanguageChange(lng)}
                className={`w-full text-left px-3 py-2 text-sm ${currentLang === lng ? 'bg-[#6c5ce7]' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                {langLabels[lng]} {t(`languageSelector.${lng}` as keyof any)}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
