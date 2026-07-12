import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { themeDefinitions } from '../themeDefinitions';

// Types
interface Account {
  id: string;
  name: string;
  username: string;
  [key: string]: unknown;
}

interface SettingsPanelProps {
  accounts: Account[];
  onSelectAccount: (account: Account) => void;
}

export default function SettingsPanel({ accounts, onSelectAccount }: SettingsPanelProps) {
  const { t, i18n } = useTranslation();
  const { settings, setTheme } = useTheme();

  const [appearance, setAppearance] = useState<{
    theme: string;
    fontSize: string;
    uiDensity: string;
    animationsEnabled: boolean;
  }>({
    theme: settings?.theme ?? 'dark',
    fontSize: settings?.fontSize ?? 'medium',
    uiDensity: settings?.uiDensity ?? 'normal',
    animationsEnabled: settings?.animationsEnabled ?? true,
  });

  const [language, setLanguage] = useState<string>(i18n.language);
  const [isLoading, setIsLoading] = useState(true);

  // Advanced action states
  const [clearCacheResult, setClearCacheResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [exportDataResult, setExportDataResult] = useState<{ success: boolean; message?: string } | null>(null);
  const [deleteAccountsResult, setDeleteAccountsResult] = useState<{ success: boolean; message?: string } | null>(null);

  useEffect(() => {
    loadAllSettings();
  }, []);

  const loadAllSettings = async () => {
    setIsLoading(true);
    try {
      const theme = await window.api.settings.get('theme');
      const fontSize = await window.api.settings.get('fontSize');
      const uiDensity = await window.api.settings.get('uiDensity');
      const animationsEnabled = await window.api.settings.get('animationsEnabled');

      setAppearance({
        theme: theme ?? 'dark',
        fontSize: fontSize ?? 'medium',
        uiDensity: uiDensity ?? 'normal',
        animationsEnabled: animationsEnabled === 'true',
      });

      const lang = await window.api.settings.get('language');
      setLanguage(lang ?? i18n.language);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Appearance handlers
  const handleThemeChange = async (theme: string) => {
    setAppearance(prev => ({ ...prev, theme }));
    await window.api.settings.set('theme', theme);
    setTheme(theme);
  };

  const handleFontSizeChange = async (fontSize: string) => {
    setAppearance(prev => ({ ...prev, fontSize }));
    await window.api.settings.set('fontSize', fontSize);
  };

  const handleUiDensityChange = async (uiDensity: string) => {
    setAppearance(prev => ({ ...prev, uiDensity }));
    await window.api.settings.set('uiDensity', uiDensity);
  };

  const handleAnimationsToggle = async () => {
    const newValue = !appearance.animationsEnabled;
    setAppearance(prev => ({ ...prev, animationsEnabled: newValue }));
    await window.api.settings.set('animationsEnabled', newValue ? 'true' : 'false');
  };

  const handleLanguageChange = async (lng: string) => {
    setLanguage(lng);
    await window.api.settings.set('language', lng);
    await i18n.changeLanguage(lng);
  };

  // Advanced actions
  const handleClearCache = async () => {
    try {
      const result = await window.api.advanced.clearCache();
      setClearCacheResult(result);
      setTimeout(() => setClearCacheResult(null), 3000);
    } catch (err) {
      setClearCacheResult({ success: false, message: String(err) });
      setTimeout(() => setClearCacheResult(null), 3000);
    }
  };

  const handleExportData = async () => {
    try {
      const result = await window.api.advanced.exportData();
      setExportDataResult(result);
      setTimeout(() => setExportDataResult(null), 5000);
    } catch (err) {
      setExportDataResult({ success: false, message: String(err) });
      setTimeout(() => setExportDataResult(null), 5000);
    }
  };

  const handleDeleteAccounts = async () => {
    if (!window.confirm(t('settings.advanced.deleteAccountsConfirm'))) {
      return;
    }
    try {
      const result = await window.api.advanced.deleteAllAccounts();
      setDeleteAccountsResult(result);
      setTimeout(() => setDeleteAccountsResult(null), 3000);
    } catch (err) {
      setDeleteAccountsResult({ success: false, message: String(err) });
      setTimeout(() => setDeleteAccountsResult(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold mb-6">{t('settings.title')}</h2>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-10 h-10 border-2 border-[#6c5ce7] border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">{t('settings.title')}</h2>

      <div className="space-y-8">
        {/* Apariencia */}
        <div className="bg-[#2f3640] rounded-lg p-6">
          <h3 className="font-medium mb-4">{t('settings.appearance')}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.appearance.theme')}
              </label>
              <div className="space-y-2">
                {Object.entries(themeDefinitions).map(([themeId]) => {
                  const label = themeId === 'dark' ? t('settings.appearance.theme.dark')
                    : themeId === 'light' ? t('settings.appearance.theme.light')
                    : themeId === 'roblox-classic' ? t('settings.appearance.theme.robloxClassic')
                    : t('settings.appearance.theme.custom');
                  return (
                    <label key={themeId} className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-md hover:bg-[#1e272e] transition-colors">
                      <input
                        type="radio"
                        checked={appearance.theme === themeId}
                        onChange={() => handleThemeChange(themeId)}
                        className="h-4 w-4 text-[#DE350D] border-gray-600 rounded"
                      />
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-white">{label}</p>
                        <p className="text-xs text-gray-500">
                          {themeId === 'dark' ? t('settings.appearance.theme.darkDesc')
                            : themeId === 'light' ? t('settings.appearance.theme.lightDesc')
                            : themeId === 'roblox-classic' ? t('settings.appearance.theme.robloxClassicDesc')
                            : t('settings.appearance.theme.customDesc')}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.appearance.fontSize')}
              </label>
              <div className="space-y-2">
                {['small', 'medium', 'large'].map((size) => (
                  <label key={size} className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-md hover:bg-[#1e272e] transition-colors">
                    <input
                      type="radio"
                      checked={appearance.fontSize === size}
                      onChange={() => handleFontSizeChange(size)}
                      className="h-4 w-4 text-[#DE350D] border-gray-600 rounded"
                    />
                    <span className="flex-1 text-white">
                      {t(`settings.appearance.fontSize.${size}` as keyof any)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.appearance.uiDensity')}
              </label>
              <div className="space-y-2">
                {['compact', 'normal', 'spacious'].map((density) => (
                  <label key={density} className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-md hover:bg-[#1e272e] transition-colors">
                    <input
                      type="radio"
                      checked={appearance.uiDensity === density}
                      onChange={() => handleUiDensityChange(density)}
                      className="h-4 w-4 text-[#DE350D] border-gray-600 rounded"
                    />
                    <span className="flex-1 text-white">
                      {t(`settings.appearance.uiDensity.${density}` as keyof any)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('settings.appearance.animations')}
              </label>
              <label className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-md hover:bg-[#1e272e] transition-colors">
                <input
                  type="checkbox"
                  checked={appearance.animationsEnabled}
                  onChange={handleAnimationsToggle}
                  className="h-4 w-4 text-[#DE350D] border-gray-600 rounded"
                />
                <span className="flex-1 text-white">{t('settings.appearance.animations.enabled')}</span>
              </label>
            </div>
          </div>
        </div>

        {/* Idioma */}
        <div className="bg-[#2f3640] rounded-lg p-6">
          <h3 className="font-medium mb-4">{t('settings.language')}</h3>
          <div className="space-y-4">
            {['es', 'en', 'pt'].map((lng) => (
              <label key={lng} className="flex items-center gap-3 cursor-pointer select-none p-3 rounded-md hover:bg-[#1e272e] transition-colors">
                <input
                  type="radio"
                  checked={language === lng}
                  onChange={() => handleLanguageChange(lng)}
                  className="h-4 w-4 text-[#DE350D] border-gray-600 rounded"
                />
                <div className="flex-1">
                  <span className="text-white">{lng === 'es' ? '🇪🇸' : lng === 'en' ? '🇬🇧' : '🇵🇹'}</span>
                  <span className="ml-2 text-white">{t(`languageSelector.${lng}` as keyof any)}</span>
                </div>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {t('settings.language.note')}
          </p>
        </div>

        {/* Seguridad — redirige a Account Control Panel */}
        <div className="bg-[#2f3640] rounded-lg p-6">
          <h3 className="font-medium mb-4">{t('settings.security')}</h3>
          <p className="text-gray-500 mb-4">
            {t('settings.security.note')}
          </p>
          <button
            onClick={() => {
              if (accounts.length > 0) {
                onSelectAccount(accounts[0]);
              } else {
                window.alert(t('settings.security.noAccounts'));
              }
            }}
            className="w-full px-4 py-2 bg-[#6c5ce7]/20 text-[#6c5ce7] rounded hover:bg-[#6c5ce7]/30 transition-colors">
            {t('settings.security.manageAccountSecurity')}
          </button>
        </div>

        {/* Avanzado */}
        <div className="bg-[#2f3640] rounded-lg p-6">
          <h3 className="font-medium mb-4">{t('settings.advanced')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#161616] rounded-lg">
              <span className="text-white">{t('settings.advanced.clearCache')}</span>
              <button
                onClick={handleClearCache}
                disabled={clearCacheResult?.success === false}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${clearCacheResult?.success === false ? 'bg-[#FF4757]/20 text-[#FF4757]' : 'bg-[#6c5ce7]/20 text-[#6c5ce7]'}`}
              >
                {clearCacheResult && clearCacheResult.success ? t('settings.advanced.success') : t('settings.advanced.clearCache')}
              </button>
            </div>
            {clearCacheResult && !clearCacheResult.success && (
              <p className="mt-2 text-xs text-[#FF4757]">{clearCacheResult.message}</p>
            )}
            {clearCacheResult && clearCacheResult.success && (
              <p className="mt-2 text-xs text-[#2ED573]">{t('settings.advanced.clearCacheSuccess')}</p>
            )}

            <div className="flex items-center justify-between p-4 bg-[#161616] rounded-lg">
              <span className="text-white">{t('settings.advanced.exportData')}</span>
              <button
                onClick={handleExportData}
                disabled={exportDataResult?.success === false}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${exportDataResult?.success === false ? 'bg-[#FF4757]/20 text-[#FF4757]' : 'bg-[#6c5ce7]/20 text-[#6c5ce7]'}`}
              >
                {exportDataResult && exportDataResult.success ? t('settings.advanced.success') : t('settings.advanced.exportData')}
              </button>
            </div>
            {exportDataResult && !exportDataResult.success && (
              <p className="mt-2 text-xs text-[#FF4757]">{exportDataResult.message}</p>
            )}
            {exportDataResult && exportDataResult.success && (
              <p className="mt-2 text-xs text-[#2ED573]">{t('settings.advanced.exportDataSuccess')}</p>
            )}

            <div className="flex items-center justify-between p-4 bg-[#161616] rounded-lg">
              <span className="text-white">{t('settings.advanced.deleteAccounts')}</span>
              <button
                onClick={handleDeleteAccounts}
                disabled={deleteAccountsResult?.success === false}
                className={`px-3 py-1.5 text-xs rounded transition-colors ${deleteAccountsResult?.success === false ? 'bg-[#FF4757]/20 text-[#FF4757]' : 'bg-[#6c5ce7]/20 text-[#6c5ce7]'}`}
              >
                {deleteAccountsResult && deleteAccountsResult.success ? t('settings.advanced.success') : t('settings.advanced.deleteAccounts')}
              </button>
            </div>
            {deleteAccountsResult && !deleteAccountsResult.success && (
              <p className="mt-2 text-xs text-[#FF4757]">{deleteAccountsResult.message}</p>
            )}
            {deleteAccountsResult && deleteAccountsResult.success && (
              <p className="mt-2 text-xs text-[#2ED573]">{t('settings.advanced.deleteAccountsSuccess')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}