// src/store/uiStore.ts
import { create } from 'zustand';
import { UIStore } from '../types';

export const useUIStore = create<UIStore>((set) => ({
  guidesVisible: true,
  isApplying: false,
  lastError: null,
  marginsLocked: true,
  updateInfo: null,

  setGuidesVisible: (v) => set({ guidesVisible: v }),
  setApplying: (state) => set({ isApplying: state }),
  setError: (message) => set({ lastError: message }),
  setMarginsLocked: (v) => set({ marginsLocked: v }),
  setUpdateInfo: (info) => set({ updateInfo: info }),
  dismissUpdate: () => set({ updateInfo: null }),
}));
