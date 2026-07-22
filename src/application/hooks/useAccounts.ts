// Application: Hook — useAccounts
// CRUD + account actions via window.api

import { useCallback } from 'react';
import { useAccountStore } from '../store/accountStore';
import { useUIStore } from '../store/uiStore';
import { MAX_ACCOUNTS } from '../../config/constants';

const api = typeof window !== 'undefined' ? window.api : undefined;

export function useAccounts() {
  const { accounts, selectedId, setAccounts, select, remove, add, update, loading, setLoading } = useAccountStore();
  const notify = useUIStore((s) => s.notify);

  const loadAccounts = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    try {
      const result = await api.account.list();
      if (result.success) setAccounts(result.data as never[]);
      else notify('error', result.error);
    } catch (e) {
      notify('error', String(e));
    }
    setLoading(false);
  }, [setAccounts, setLoading, notify]);

  const addAccount = useCallback(async (cookie: string, group?: string) => {
    if (!api) return { success: false, error: 'Electron API no disponible (modo browser)' };
    const result = await api.account.add(cookie, group);
    if (result.success) {
      notify('success', 'Cuenta agregada');
      await loadAccounts();
    } else {
      notify('error', result.error);
    }
    return result;
  }, [notify, loadAccounts]);

  const removeAccount = useCallback(async (id: string) => {
    if (!api) return;
    const result = await api.account.remove(id);
    if (result.success) {
      remove(id);
      notify('success', 'Cuenta eliminada');
    } else {
      notify('error', result.error);
    }
  }, [remove, notify]);

  const loginBrowser = useCallback(async () => {
    if (!api) return { success: false, error: 'Electron API no disponible' };
    const result = await api.account.loginBrowser();
    if (result.success) {
      await addAccount((result.data as { cookie: string }).cookie);
    } else {
      notify('error', result.error);
    }
    return result;
  }, [addAccount, notify]);

  return {
    accounts, selectedId, loading,
    loadAccounts, addAccount, removeAccount, loginBrowser,
    select, add, update,
    canAddMore: accounts.length < MAX_ACCOUNTS,
  };
}
