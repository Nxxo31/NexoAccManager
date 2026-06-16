import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface AddAccountFormProps {
  onSuccess: () => void;
}

export default function AddAccountForm({ onSuccess }: AddAccountFormProps) {
  const { t } = useTranslation();
  const [cookie, setCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState('Default');
  const [checkingLimit, setCheckingLimit] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ canAdd: boolean; currentCount: number; limit: number; plan: string } | null>(null);

  const checkAccountLimit = async () => {
    try {
      setCheckingLimit(true);
      // @ts-expect-error api existe en window via preload
      const result = await window.api.auth.canAddAccount();
      if (result && result.success !== false && result.data) {
        const data = result.data as {
          canAdd: boolean;
          currentCount: number;
          limit: number;
          plan: string;
        };
        setLimitInfo(data);
        return data;
      }
      return { canAdd: false, currentCount: 0, limit: 0, plan: 'UNKNOWN' };
    } catch (err) {
      console.error('Error checking account limit:', err);
      return { canAdd: false, currentCount: 0, limit: 0, plan: 'ERROR' };
    } finally {
      setCheckingLimit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = cookie.trim();
    if (!trimmed) {
      setError(t('addAccount.errorEmptyCookie'));
      return;
    }

    if (!trimmed.startsWith('_|WARNING:-DO-NOT-SHARE|_')) {
      setError(t('addAccount.errorInvalidFormat'));
      return;
    }

    // Verificar límite de cuenta antes de intentar agregar
    const limitData = await checkAccountLimit();
    if (!limitData.canAdd) {
      setError(t('addAccount.limitReachedText', { current: limitData.currentCount, limit: limitData.limit, plan: limitData.plan }));
      return;
    }

    setLoading(true);
    try {
      // @ts-expect-error api existe en window via preload
      await window.api.account.add(trimmed);
      setCookie('');
      onSuccess();
    } catch (err: unknown) {
      setError(t('addAccount.errorAdding'));
    } finally {
      setLoading(false);
    }
  };

  // Verificar límite al cargar el componente
  useEffect(() => {
    checkAccountLimit();
  }, []);

  return (
    <div className="bg-[#2f3640] rounded-lg p-4">
      <h3 className="font-semibold mb-3">{t('addAccount.title')}</h3>

      {limitInfo && !limitInfo.canAdd && (
        <div className="p-3 bg-red-900/30 border border-red-600/50 rounded mb-4 text-sm text-red-300">
          {t('addAccount.limitReachedText', { current: limitInfo.currentCount, limit: limitInfo.limit, plan: limitInfo.plan })}
          <button
            onClick={() => {
              // Aquí podríamos navegar a una página de upgrade o mostrar más info
              alert(`Para agregar más cuentas, necesitas actualizar tu plan. Actualmente tienes el plan ${limitInfo.plan} con límite de ${limitInfo.limit} cuentas.`);
            }}
            className="ml-2 text-xs text-[#6c5ce7] underline hover:cursor-pointer"
          >
            {t('addAccount.upgradeLink')}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            {t('addAccount.labelCookie')}
          </label>
          <textarea
            value={cookie}
            onChange={(e) => setCookie(e.target.value)}
            placeholder={t('addAccount.placeholderCookie')}
            className="w-full bg-[#1e272e] border border-gray-600 rounded-md px-3 py-2 text-sm text-[#f5f6fa] placeholder-gray-600 resize-none focus:outline-none focus:border-[#6c5ce7] transition-colors"
            rows={4}
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            {t('addAccount.labelGroup')}
          </label>
          <input
            type="text"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            placeholder={t('addAccount.placeholderGroup')}
            className="w-full bg-[#1e272e] border border-gray-600 rounded-md px-3 py-2 text-sm text-[#f5f6fa] placeholder-gray-600 focus:outline-none focus:border-[#6c5ce7] transition-colors"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-2 bg-red-900/30 border border-red-600/50 rounded text-xs text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !cookie.trim() || (limitInfo && !limitInfo.canAdd)}
          className="w-full py-2 bg-[#6c5ce7] text-white text-sm font-medium rounded-md hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('addAccount.buttonAdding') : !limitInfo || !limitInfo.canAdd ? t('addAccount.buttonLimitReached') : t('addAccount.buttonAdd')}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
        {t('addAccount.securityNote')}
      </p>
    </div>
  );
}