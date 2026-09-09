// Application: Hook — useAccounts
// CRUD + account actions via window.api

import { useCallback } from 'react';
import { useAccountStore } from '../store/accountStore';
import { useUIStore } from '../store/uiStore';
import { MAX_ACCOUNTS } from '../../config/constants';

const api = typeof window !== 'undefined' ? window.api : undefined;

export function useAccounts() {
  const accounts = useAccountStore((s) => s.accounts);
  const selectedId = useAccountStore((s) => s.selectedId);
  const setAccounts = useAccountStore((s) => s.setAccounts);
  const select = useAccountStore((s) => s.select);
  const remove = useAccountStore((s) => s.remove);
  const add = useAccountStore((s) => s.add);
  const update = useAccountStore((s) => s.update);
  const loading = useAccountStore((s) => s.loading);
  const setLoading = useAccountStore((s) => s.setLoading);
  const notify = useUIStore((s) => s.notify);

  const loadAccounts = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    try {
      const result = await api.account.list();
      if (result.success) setAccounts(result.data as never[]);
      else notify('error', result.error ?? 'Error desconocido');
    } catch (e) {
      notify('error', String(e));
    }
    setLoading(false);
  }, [setAccounts, setLoading, notify]);

  const addAccount = useCallback(async (cookie: string, group?: string) => {
    if (!api) return { success: false, error: 'Electron API no disponible (modo browser)' };
    const result = await api.account.add(cookie, group ?? 'Default');
    if (result.success) {
      notify('success', 'Cuenta agregada');
      await loadAccounts();
    } else {
      notify('error', result.error ?? 'Error desconocido');
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
      notify('error', result.error ?? 'Error desconocido');
    }
  }, [remove, notify]);

  const loginBrowser = useCallback(async () => {
    if (!api) return { success: false, error: 'Electron API no disponible' };
    const result = await api.account.loginBrowser();
    if (result.success) {
      await loadAccounts(); // account was added internally by IPC handler
      notify('success', 'Cuenta agregada');
    } else {
      notify('error', result.error ?? 'Error desconocido');
    }
    return result;
  }, [loadAccounts, notify]);

  return {
    accounts, selectedId, loading,
    loadAccounts, addAccount, removeAccount, loginBrowser,
    select, add, update,
    canAddMore: accounts.length < MAX_ACCOUNTS,
  };
}
