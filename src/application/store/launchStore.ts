// Application: Zustand Launch Store — connects GamesView/ServersView → LaunchDock
// Centraliza el estado de lanzamiento para que cualquier vista pueda propagar
// el Place ID seleccionado y el LaunchDock persistente lo consuma.
// Persiste último Place ID y juego seleccionado entre reinicios (no estado de lanzamiento).

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SelectedGame {
  placeId: string;
  name: string;
  thumbnail?: string;
}

export type LaunchStatus = 'idle' | 'ready' | 'launching' | 'success' | 'error';

interface LaunchState {
  selectedGame: SelectedGame | null;
  selectedPlaceId: string;
  selectedAccountId: string | null;
  shuffle: boolean;
  launchStatus: LaunchStatus;
  launchError: string | null;
  setSelectedGame: (game: SelectedGame | null) => void;
  setSelectedPlaceId: (placeId: string) => void;
  setSelectedAccountId: (id: string | null) => void;
  setShuffle: (shuffle: boolean) => void;
  setLaunchStatus: (status: LaunchStatus, error?: string | null) => void;
  clearSelection: () => void;
}

export const useLaunchStore = create<LaunchState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'nam-launch-storage',
      // Only persist selectedGame, selectedPlaceId, shuffle — NOT ephemeral launch state
      partialize: (state) => ({
        selectedGame: state.selectedGame,
        selectedPlaceId: state.selectedPlaceId,
        shuffle: state.shuffle,
      }),
    }
  )
);
