import { describe, it, expect, vi } from 'vitest';
import { useUIStore } from './useUIStore';

describe('useUIStore', () => {
  it('initializes with correct defaults', () => {
    const state = useUIStore.getState();
    expect(state.activeView).toBe('accounts');
    expect(state.sidebarCollapsed).toBe(false);
    expect(state.jobIdShuffle).toBe(false);
    expect(state.hideUsernames).toBe(false);
    expect(state.searchQuery).toBe('');
    expect(state.language).toBe('es');
    expect(state.savePasswords).toBe(false);
    expect(state.disableAgingAlert).toBe(false);
    expect(state.autoRelaunch).toBe(false);
    expect(state.connectionWatcher).toBe(false);
    expect(state.preventDuplicateInstances).toBe(false);
  });

  it('setActiveView changes view', () => {
    useUIStore.getState().setActiveView('servers');
    expect(useUIStore.getState().activeView).toBe('servers');
    useUIStore.getState().setActiveView('accounts');
  });

  it('setSavePasswords toggles savePasswords', () => {
    useUIStore.getState().setSavePasswords(true);
    expect(useUIStore.getState().savePasswords).toBe(true);
    useUIStore.getState().setSavePasswords(false);
    expect(useUIStore.getState().savePasswords).toBe(false);
  });

  it('setDisableAgingAlert toggles disableAgingAlert', () => {
    useUIStore.getState().setDisableAgingAlert(true);
    expect(useUIStore.getState().disableAgingAlert).toBe(true);
    useUIStore.getState().setDisableAgingAlert(false);
  });

  it('setAutoRelaunch toggles autoRelaunch', () => {
    useUIStore.getState().setAutoRelaunch(true);
    expect(useUIStore.getState().autoRelaunch).toBe(true);
    useUIStore.getState().setAutoRelaunch(false);
  });

  it('setConnectionWatcher toggles connectionWatcher', () => {
    useUIStore.getState().setConnectionWatcher(true);
    expect(useUIStore.getState().connectionWatcher).toBe(true);
    useUIStore.getState().setConnectionWatcher(false);
  });

  it('setPreventDuplicateInstances toggles preventDuplicateInstances', () => {
    useUIStore.getState().setPreventDuplicateInstances(true);
    expect(useUIStore.getState().preventDuplicateInstances).toBe(true);
    useUIStore.getState().setPreventDuplicateInstances(false);
  });

  it('toggleSidebar toggles sidebarCollapsed', () => {
    const initial = useUIStore.getState().sidebarCollapsed;
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarCollapsed).toBe(!initial);
    useUIStore.getState().toggleSidebar();
  });

  it('toggleJobIdShuffle toggles jobIdShuffle', () => {
    const initial = useUIStore.getState().jobIdShuffle;
    useUIStore.getState().toggleJobIdShuffle();
    expect(useUIStore.getState().jobIdShuffle).toBe(!initial);
    useUIStore.getState().toggleJobIdShuffle();
  });
});