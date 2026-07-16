import { useCallback } from 'react';
import { useAccountStore } from '@renderer/store/useAccountStore';
import { useUIStore } from '@renderer/store/useUIStore';

export const useAccountActions = () => {
  const {
    accounts,
    setAccounts,
    selectedAccount,
    setSelectedAccount,
    setError,
    setLoading,
  } = useAccountStore();

  const {
    hideUsernames,
    setHideUsernames,
    jobIdShuffle,
    toggleJobIdShuffle,
  } = useUIStore();

  const fetchAccounts = useCallback(async () => {
    // This would call window.api.account.list() - placeholder for now
    try {
      // In real implementation, this would fetch from IPC
      setLoading(true);
      // Simulate empty for now
      setAccounts([]);
    } catch (err) {
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, [setAccounts, setError, setLoading]);

  const handleLoginBrowser = useCallback(
    async (group?: string) => {
      try {
        // const result = await window.api.account.loginBrowser(group);
        // if (!result?.success) throw new Error(result.error || 'Login failed');
        // await fetchAccounts();
        // const addModalStore = useAddModalStore.getState();
        // addModalStore.setShowAddModal(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Login error');
      }
    },
    [setError, fetchAccounts]
  );

  const handleAddCookie = useCallback(
    async (cookie: string, group?: string) => {
      try {
        // const result = await window.api.account.add(cookie, group);
        // if (!result?.success) throw new Error(result.error || 'Add failed');
        // await fetchAccounts();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Add cookie error');
      }
    },
    [setError, fetchAccounts]
  );

  const handleBulkImport = useCallback(
    async (input: string, format: 'user:pass' | 'cookies') => {
      try {
        // const result = await window.api.account.bulkImport(input, format);
        // if (!result?.success) throw new Error(result.error || 'Bulk import failed');
        // await fetchAccounts();
        // return result.data;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Bulk import error');
      }
    },
    [setError, fetchAccounts]
  );

  const handleDeleteAccount = useCallback(
    async (id: string) => {
      try {
        // const result = await window.api.account.remove(id);
        // if (!result?.success) throw new Error(result.error || 'Delete failed');
        // await fetchAccounts();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Delete error');
      }
    },
    [setError, fetchAccounts]
  );

  const handleSaveAlias = useCallback(
    async (accountId: string, alias: string) => {
      try {
        // const result = await window.api.account.updateProfile(accountId, { displayName: alias });
        // if (!result?.success) throw new Error(result.error || 'Save alias failed');
        // await fetchAccounts();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save alias error');
      }
    },
    [setError, fetchAccounts]
  );

  const handleSaveDescription = useCallback(
    async (accountId: string, description: string) => {
      try {
        // const result = await window.api.account.setField(accountId, 'description', description);
        // if (!result?.success) throw new Error(result.error || 'Save description failed');
        // await fetchAccounts();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Save description error');
      }
    },
    [setError, fetchAccounts]
  );

  const handleFollowUser = useCallback(
    async (userId: number) => {
      if (selectedAccount) {
        // await window.api.account.followUser(selectedAccount.id, userId);
      }
    },
    [selectedAccount]
  );

  const handleLaunchGame = useCallback(
    async (accountId: string, pId: string, jId: string) => {
      // await window.api.roblox.launch(accountId, pId, jId || undefined);
    },
    []
  );

  const handleJoinServer = useCallback(async () => {
    if (!selectedAccount) return;
    // setLaunching(true);
    try {
      // let finalJobId = jobId;
      // if (jobIdShuffle && !jobId) {
      //   const result = await window.api.roblox.getServers(placeId, selectedAccount.id);
      //   const servers = Array.isArray(result) ? result : (result?.data || []);
      //   if (servers.length > 0) {
      //     finalJobId = servers[Math.floor(Math.random() * servers.length)].jobId;
      //   }
      // }
      // await handleLaunchGame(selectedAccount.id, placeId, finalJobId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Join server error');
    } finally {
      // setLaunching(false);
    }
  }, [
    selectedAccount,
    // placeId,
    // jobId,
    // jobIdShuffle,
    // setLaunching,
    // setError,
  ]);

  const handleLaunchApp = useCallback(() => {
    if (!selectedAccount) return;
    // window.api.roblox.launch(selectedAccount.id).then((result: any) => {
    //   if (result?.success === false) setError(result.error || 'Launch error');
    // });
  }, [selectedAccount, setError]);

  const handleCopyPlaceId = useCallback(() => {
    // if (placeId) {
    //   navigator.clipboard.writeText(placeId);
    //   // setCopiedPlaceId(true); // Would need state
    //   // setTimeout(() => setCopiedPlaceId(false), 2000);
    // }
  }, [
    // placeId,
    // setCopiedPlaceId
  ]);

  const handleSaveAliasInline = useCallback(async () => {
    if (!selectedAccount) return;
    // setAliasSaving(true);
    try {
      // await handleSaveAlias(selectedAccount.id, aliasDraft);
      // setEditingAlias(false);
    } catch (e) {
      console.error(e);
    } finally {
      // setAliasSaving(false);
    }
  }, [selectedAccount, handleSaveAlias]);

  const handleSaveDescInline = useCallback(async () => {
    if (!selectedAccount) return;
    // setDescSaving(true);
    try {
      // await handleSaveDescription(selectedAccount.id, descDraft);
      // setEditingDesc(false);
    } catch (e) {
      console.error(e);
    } finally {
      // setDescSaving(false);
    }
  }, [selectedAccount, handleSaveDescription]);

  const handleThemeChange = useCallback(
    async (partial: any) => {
      // const result = await window.api.theme.set(partial);
      // if (result?.success && result.data) setTheme(result.data.settings);
      // else if (result?.settings) setTheme(result.settings);
    },
    [/* setTheme */]
  );

  const handleLanguageChange = useCallback(
    async (lang: string) => {
      // const result = await window.api.language.set(lang);
      // if (result?.success) setLanguage(lang);
    },
    [/* setLanguage */]
  );

  const handleExportData = useCallback(async () => {
    // const result = await window.api.advanced.exportData();
    // if (result?.success && result.data) {
    //   const blob = new Blob([JSON.stringify(result.data, null, 2)], {
    //     type: 'application/json',
    //   });
    //   const url = URL.createObjectURL(blob);
    //   const a = document.createElement('a');
    //   a.href = url;
    //   a.download = 'nexoacc-export.json';
    //   a.click();
    //   URL.revokeObjectURL(url);
    // }
  }, []);

  const handleDeleteAll = useCallback(async () => {
    // const result = await window.api.advanced.deleteAllAccounts();
    // if (result?.success) await fetchAccounts();
  }, [fetchAccounts]);

  const handleClearCache = useCallback(async () => {
    // await window.api.advanced.clearCache();
  }, []);

  return {
    // State getters
    accounts,
    selectedAccount,
    setSelectedAccount,
    hideUsernames,
    jobIdShuffle,
    toggleJobIdShuffle,

    // State setters
    setAccounts,
    setHideUsernames,

    // Actions
    fetchAccounts,
    handleLoginBrowser,
    handleAddCookie,
    handleBulkImport,
    handleDeleteAccount,
    handleSaveAlias,
    handleSaveDescription,
    handleFollowUser,
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