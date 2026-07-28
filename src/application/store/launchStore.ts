// Application: Zustand Launch Store — connects GamesView/ServersView → LaunchDock
// Centraliza el estado de lanzamiento para que cualquier vista pueda propagar
// el Place ID seleccionado y el LaunchDock persistente lo consuma.

import { create } from 'zustand';

export interface SelectedGame {
  placeId: string;
  name: string;
  thumbnail?: string;
}

export type LaunchStatus = 'idle' | 'ready' | 'launching' | 'success' | 'error';

interface LaunchState {
  // Datos del juego/servidor seleccionado
  selectedGame: SelectedGame | null;
  selectedPlaceId: string;
  // cuenta seleccionada para lanzar (sincronizada con accountStore.selectedId)
  selectedAccountId: string | null;
  // shuffle = unirse a un servidor aleatorio (genera jobId interno)
  shuffle: boolean;
  // estado del lanzamiento
  launchStatus: LaunchStatus;
  launchError: string | null;
  // Acciones
  setSelectedGame: (game: SelectedGame | null) => void;
  setSelectedPlaceId: (placeId: string) => void;
  setSelectedAccountId: (id: string | null) => void;
  setShuffle: (shuffle: boolean) => void;
  setLaunchStatus: (status: LaunchStatus, error?: string | null) => void;
  clearSelection: () => void;
}

export const useLaunchStore = create<LaunchState>((set) => ({
  selectedGame: null,
  selectedPlaceId: '',
  selectedAccountId: null,
  shuffle: false,
  launchStatus: 'idle',
  launchError: null,

  setSelectedGame: (game) =>
    set({
      selectedGame: game,
      selectedPlaceId: game?.placeId ?? '',
      launchStatus: game ? 'ready' : 'idle',
      launchError: null,
    }),

  setSelectedPlaceId: (placeId) =>
    set({
      selectedPlaceId: placeId,
      launchStatus: placeId ? 'ready' : 'idle',
      launchError: null,
    }),

  setSelectedAccountId: (id) => set({ selectedAccountId: id }),

  setShuffle: (shuffle) => set({ shuffle }),

  setLaunchStatus: (status, error = null) =>
    set({ launchStatus: status, launchError: error }),

  clearSelection: () =>
    set({
      selectedGame: null,
      selectedPlaceId: '',
      launchStatus: 'idle',
      launchError: null,
    }),
}));
