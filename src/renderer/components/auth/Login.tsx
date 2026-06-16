import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login({ 
  onLogin, 
  onRegister,
  loading,
  error 
}: { 
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: () => void;
  loading: boolean;
  error: string | null;
}) {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [langOpen, setLangOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setLocalError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setLocalError(null);
    setSuccess(null);

    try {
      await onLogin(formData.email, formData.password);
      setSuccess(t('auth.successLogin', { defaultValue: 'Inicio de sesión exitoso' }));
    } catch (err: any) {
      setLocalError(err.message || t('auth.errorLogin'));
    } finally {
      setLocalLoading(false);
    }
  };

  const handleLanguageChange = async (lng: string) => {
    try {
      // @ts-ignore: window.api is exposed via preload
      await window.api.settings.set('language', lng);
      i18n.changeLanguage(lng);
    } catch (e) {
      console.error('Failed to change language:', e);
    }
    setLangOpen(false);
  };

  // Get flag based on language
  const getFlag = (lng: string) => {
    if (lng === 'es') return '🇪🇸';
    if (lng === 'en') return '🇬🇧';
    if (lng === 'pt') return '🇵🇹';
    return '🌐';
  };

  const currentFlag = getFlag(i18n.language);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0d0d0d] to-[#161616]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white">{t('auth.login.title')}</h2>
          <p className="text-sm text-[#a0a0a0]">{t('auth.login.subtitle')}</p>
        </div>

        {error || localError && (
          <div className="p-4 bg-red-900/50 border border-red-600 rounded text-sm">
            {error || localError}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-900/50 border border-green-600 rounded text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t('auth.login.labelEmail')}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1e272e] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6347FF] text-white placeholder-[#a0a0a0]"
              placeholder={t('auth.login.placeholderEmail')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              {t('auth.login.labelPassword')}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-[#1e272e] border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6347FF] text-white placeholder-[#a0a0a0]"
              placeholder={t('auth.login.placeholderPassword')}
              required
            />
          </div>

          <button
            type="submit"
            disabled={localLoading}
            className={`w-full flex items-center justify-center px-4 py-3 bg-[#6347FF] hover:bg-[#8B6FFF] 
                       text-white font-medium rounded-md transition-colors disabled:opacity-50`}
          >
            {localLoading ? (
              <>
                <svg className="animate-spin w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 014.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-13.583-8m0 0a8.003 8.003 0 0113.583-8m0 0A8.003 8.003 0 0016.583 8m-6.583 0a5.586 5.586 0 01-5.583 5.583m11.166 3a5.586 5.586 0 01-5.583 5.583m0-11.166a5.586 5.586 0 005.583 5.583m0 0a5.586 5.586 0 015.583 5.583Z" />
                </svg>
                {t('auth.buttonLoggingIn', { defaultValue: 'Iniciando sesión...' })}
              </>
            ) : (
              t('auth.buttonLogin', { defaultValue: 'Iniciar Sesión' })
            )}
          </button>
        </form>

        <div className="text-center text-sm text-[#a0a0a0]">
          <p>
            {t('auth.noAccountLink')} {' '}
            <button onClick={onRegister} className="text-[#6347FF] hover:text-[#8B6FFF] underline">
              {t('auth.buttonRegister', { defaultValue: 'Registrarse' })}
            </button>
          </p>
        </div>

        {/* Language selector */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-[#a0a0a0]">{t('languageSelector.title')}:</span>
          <div className="relative inline-block">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white focus:outline-none"
              aria-label={t('languageSelector.title')}
            >
              <span>{currentFlag}</span>
              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-2 w-32 bg-[#2f3640] border border-gray-700 rounded-md shadow-lg z-10">
                {[ 'es', 'en', 'pt' ].map(lng => {
                  const flag = getFlag(lng);
                  const label = t(`languageSelector.${lng}`);
                  return (
                    <button
                      key={lng}
                      onClick={() => handleLanguageChange(lng)}
                      className={`w-full text-left px-3 py-2 text-sm ${i18n.language === lng ? 'bg-[#6c5ce7]' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
                    >
                      {flag} {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}