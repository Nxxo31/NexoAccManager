import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface AddAccountFormProps {
  onSuccess: () => void;
}

const MAX_ACCOUNTS = 50;

export default function AddAccountForm({ onSuccess }: AddAccountFormProps) {
  const { t } = useTranslation();
  const [cookie, setCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [group, setGroup] = useState('Default');
  const [accountCount, setAccountCount] = useState(0);

  const fetchCount = async () => {
    try {
      // @ts-expect-error api existe en window via preload
      const result = await window.api.account.list();
      const count = Array.isArray(result) ? result.length : 0;
      setAccountCount(count);
    } catch (err) {
      console.error('Error fetching account count:', err);
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

    // Verificar límite local (50 cuentas)
    if (accountCount >= MAX_ACCOUNTS) {
      setError(t('addAccount.limitReachedText', { current: accountCount, limit: MAX_ACCOUNTS }));
      return;
    }

    setLoading(true);
    try {
      // @ts-expect-error api existe en window via preload
      await window.api.account.add(trimmed, group);
      setCookie('');
      onSuccess();
      fetchCount(); // actualizar contador
    } catch (err: unknown) {
      setError(t('addAccount.errorAdding'));
    } finally {
      setLoading(false);
    }
  };

  // Verificar contador al cargar el componente
  useEffect(() => {
    fetchCount();
  }, []);

  const limitReached = accountCount >= MAX_ACCOUNTS;

  return (
    <div className="bg-[#2f3640] rounded-lg p-4">
      <h3 className="font-semibold mb-3">{t('addAccount.title')}</h3>

      {limitReached && (
        <div className="p-3 bg-red-900/30 border border-red-600/50 rounded mb-4 text-sm text-red-300">
          {t('addAccount.limitReachedText', { current: accountCount, limit: MAX_ACCOUNTS })}
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
            className="w-full bg-[#1e272e] border border-gray-600 rounded-md px-3 py-2 text-sm text-[#f5f6fa] focus:outline-none focus:border-[#6c5ce7] transition-colors"
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
          disabled={loading || !cookie.trim() || limitReached}
          className="w-full py-2 bg-[#6c5ce7] text-white text-sm font-medium rounded-md hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('addAccount.buttonAdding') : limitReached ? t('addAccount.buttonLimitReached') : t('addAccount.buttonAdd')}
        </button>
      </form>

      <p className="text-xs text-gray-500 mt-3 leading-relaxed whitespace-pre-line">
        {t('addAccount.securityNote')}
      </p>

      <div className="mt-2 text-xs text-gray-600">
        {accountCount}/{MAX_ACCOUNTS}
      </div>
    </div>
  );
}
