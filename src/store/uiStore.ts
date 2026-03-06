// src/store/uiStore.ts
import { create } from 'zustand';
import { UIStore } from '../types';

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'grid',
  isApplying: false,
  lastError: null,
  lastSuccess: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setApplying: (state) => set({ isApplying: state }),
  setError: (message) => set({ lastError: message, lastSuccess: false }),
  setSuccess: (state) => set({ lastSuccess: state, lastError: null }),
}));
