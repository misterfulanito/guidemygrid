// src/store/uiStore.ts
import { create } from 'zustand';
import { UIStore } from '../types';

export const useUIStore = create<UIStore>((set) => ({
  guidesVisible: true,
  isApplying: false,
  lastError: null,
  marginsLocked: true,

  setGuidesVisible: (v) => set({ guidesVisible: v }),
  setApplying: (state) => set({ isApplying: state }),
  setError: (message) => set({ lastError: message }),
  setMarginsLocked: (v) => set({ marginsLocked: v }),
}));
