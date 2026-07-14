import { create } from 'zustand';

interface UIStore {
  jobIdShuffle: boolean;
  toggleJobIdShuffle: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  jobIdShuffle: false,
  toggleJobIdShuffle: () => set((state) => ({ jobIdShuffle: !state.jobIdShuffle })),
}));