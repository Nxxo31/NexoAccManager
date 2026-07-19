import { useCallback } from 'react';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { useUIStore } from '@renderer/store/useUIStore';

/**
 * useAccountActions — all account-related handlers connected to real IPC.
 * Extracted from the monolithic App.tsx as part of the v3.0.0 refactor.
 */
export const useAccountActions = () => {
  const {
    accounts,
    setAccounts,
    selectedAccount,
    setSelectedAccount,
    setError,
    setLoading,
    updateAccount,
    removeAccount,
  } = useAccountStore();

  const {
    hideUsernames,
    setHideUsernames,
    jobIdShuffle,
    toggleJobIdShuffle,
  } = useUIStore();

  const api = typeof window !== 'undefined' ? (window as any).api : null;

  // ─── Account CRUD ───────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    if (!api) return;
    try {
      setLoading(true);
      const result = await api.account.list();
      // Manejar ambos formatos: { success, data } | Account[]
      if (result?.success && Array.isArray(result.data)) {
        setAccounts(result.data);
      } else if (Array.isArray(result)) {
        setAccounts(result);
      } else if (result?.success && result.data) {
        // data podría no ser array en algún caso edge
        setAccounts(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err) {
      setError('Failed to load accounts');
      console.error('fetchAccounts error:', err);
    } finally {
      setLoading(false);
    }
  }, [api, setAccounts, setError, setLoading]);

  const handleLoginBrowser = useCallback(
    async (group?: string) => {
      if (!api) return;
      try {
        const result = await api.account.loginBrowser(group);
        console.log('[handleLoginBrowser] result:', result);
        if (result?.success === false) throw new Error(result.error || 'Login failed');
        // Forzar refresco desde la DB
        await fetchAccounts();
        // Cambiar a la vista de cuentas para que el usuario vea el resultado
        useUIStore.getState().setActiveView('accounts');
      } catch (e) {
        console.error('[handleLoginBrowser] error:', e);
        setError(e instanceof Error ? e.message : 'Login error');
        throw e; // re-throw para que el modal muestre el error
      }
    },
    [api, setError, fetchAccounts]
  );

  const handleLogin = useCallback(
    async (username: string, password: string, group?: string) => {
      if (!api) return;
      try {
        const result = await api.account.login(username, password, group);
        if (result?.success === false) throw new Error(result.error || 'Login failed');
        await fetchAccounts();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Login error');
      }
    },
    [api, setError, fetchAccounts]
  );

  const handleAddCookie = useCallback(
    async (cookie: string, group?: string) => {
      if (!api) return;
      try {
        const result = await api.account.add(cookie, group);
        if (result?.success === false) throw new Error(result.error || 'Add failed');
        await fetchAccounts();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Add cookie error');
      }
    },
    [api, setError, fetchAccounts]
  );

  const handleBulkImport = useCallback(
    async (input: string, format: 'user:pass' | 'cookies') => {
      if (!api) return;
      try {
        const result = await api.account.bulkImport(input, format);
        if (result?.success === false) throw new Error(result.error || 'Bulk import failed');
        await fetchAccounts();
        return result?.data;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Bulk import error');
      }
    },
    [api, setError, fetchAccounts]
  );

  const handleDeleteAccount = useCallback(
    async (id: string) => {
      if (!api) return;
      try {
        const result = await api.account.remove(id);
        if (result?.success === false) throw new Error(result.error || 'Delete failed');
        removeAccount(id);
        if (selectedAccount?.id === id) setSelectedAccount(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Delete error');
      }
    },
    [api, setError, removeAccount, selectedAccount, setSelectedAccount]
  );

  const handleSaveAlias = useCallback(
    async (accountId: string, alias: string) => {
      if (!api) return;
      try {
        const result = await api.account.updateProfile(accountId, { displayName: alias });
        if (result?.success === false) throw new Error(result.error || 'Save alias failed');
        updateAccount(accountId, { displayName: alias });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save alias error');
      }
    },
    [api, setError, updateAccount]
  );

  const handleSaveDescription = useCallback(
    async (accountId: string, description: string) => {
      if (!api) return;
      try {
        const result = await api.account.updateProfile(accountId, { description });
        if (result?.success === false) throw new Error(result.error || 'Save description failed');
        updateAccount(accountId, { description });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save description error');
      }
    },
    [api, setError, updateAccount]
  );

  // ─── Social/actions ─────────────────────────────────────────

  const followUser = useCallback(
    async (userId: number) => {
      if (!api || !selectedAccount) return;
      try {
        await api.account.followUser(selectedAccount.id, userId);
      } catch (e) {
        console.error('follow error:', e);
      }
    },
    [api, selectedAccount]
  );

  const handleLaunchGame = useCallback(
    async (accountId: string, placeId: string, jobId?: string) => {
      if (!api) return;
      await api.roblox.launch(accountId, placeId, jobId);
    },
    [api]
  );

  const handleJoinServer = useCallback(
    async (placeId: string, jobId: string) => {
      if (!api || !selectedAccount) return;
      try {
        let finalJobId = jobId;
        if (!finalJobId && jobIdShuffle) {
          const result = await api.roblox.getServers(placeId, selectedAccount.id);
          const servers = Array.isArray(result) ? result : (result?.data || []);
          if (servers.length > 0) {
            finalJobId = servers[Math.floor(Math.random() * servers.length)].jobId;
          }
        }
        if (placeId) {
          await handleLaunchGame(selectedAccount.id, placeId, finalJobId || undefined);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Join server error');
      }
    },
    [api, selectedAccount, jobIdShuffle, handleLaunchGame, setError]
  );

  const handleLaunchApp = useCallback(
    async (accountId?: string) => {
      if (!api) return;
      const id = accountId ?? selectedAccount?.id;
      if (!id) return;
      try {
        const result = await api.roblox.launch(id);
        if (result?.success === false) setError(result.error || 'Launch error');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Launch error');
      }
    },
    [api, selectedAccount, setError]
  );

  const handleCopyPlaceId = useCallback((placeId: string) => {
    if (placeId) {
      navigator.clipboard.writeText(placeId);
    }
  }, []);

  // ─── Inline edit (aliases) ──────────────────────────────────

  const handleSaveAliasInline = useCallback(
    async (aliasDraft: string) => {
      if (!selectedAccount) return;
      await handleSaveAlias(selectedAccount.id, aliasDraft);
    },
    [selectedAccount, handleSaveAlias]
  );

  const handleSaveDescInline = useCallback(
    async (descDraft: string) => {
      if (!selectedAccount) return;
      await handleSaveDescription(selectedAccount.id, descDraft);
    },
    [selectedAccount, handleSaveDescription]
  );

  // ─── Theme / Language ───────────────────────────────────────

  const handleThemeChange = useCallback(
    async (partial: any) => {
      if (!api) return;
      try {
        const result = await api.theme.set(partial);
        if (result?.success && result.data) return result.data.settings;
        if (result?.settings) return result.settings;
      } catch (e) {
        console.error('theme change error:', e);
      }
    },
    [api]
  );

  const handleLanguageChange = useCallback(
    async (lang: string) => {
      if (!api) return;
      try {
        await api.language.set(lang);
        return lang;
      } catch (e) {
        console.error('language change error:', e);
      }
    },
    [api]
  );

  // ─── Advanced ───────────────────────────────────────────────

  const handleExportData = useCallback(async () => {
    if (!api) return;
    try {
      const result = await api.advanced.exportData();
      if (result?.success && result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nexoacc-export.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('export error:', e);
    }
  }, [api]);

  const handleDeleteAll = useCallback(async () => {
    if (!api) return;
    try {
      const result = await api.advanced.deleteAllAccounts();
      if (result?.success !== false) await fetchAccounts();
    } catch (e) {
      console.error('delete all error:', e);
    }
  }, [api, fetchAccounts]);

  const handleClearCache = useCallback(async () => {
    if (!api) return;
    try {
      await api.advanced.clearCache();
    } catch (e) {
      console.error('clear cache error:', e);
    }
  }, [api]);

  return {
    // State
    accounts,
    selectedAccount,
    setSelectedAccount,
    hideUsernames,
    setHideUsernames,
    jobIdShuffle,
    toggleJobIdShuffle,
    setAccounts,
    // Actions
    fetchAccounts,
    handleLoginBrowser,
    handleLogin,
    handleAddCookie,
    handleBulkImport,
    handleDeleteAccount,
    handleSaveAlias,
    handleSaveDescription,
    followUser,
    handleLaunchGame,
    handleJoinServer,
    handleLaunchApp,
    handleCopyPlaceId,
    handleSaveAliasInline,
    handleSaveDescInline,
    handleThemeChange,
    handleLanguageChange,
    handleExportData,
    handleDeleteAll,
    handleClearCache,
  };
};