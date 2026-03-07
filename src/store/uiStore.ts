// src/store/uiStore.ts
import { create } from 'zustand';
import { UIStore } from '../types';

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'grid',
  isApplying: false,
  lastError: null,
  lastSuccess: false,
  guidesVisible: true,
  documentGuideCount: 0,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setApplying: (state) => set({ isApplying: state }),
  setError: (message) => set({ lastError: message, lastSuccess: false }),
  setSuccess: (state) => set({ lastSuccess: state, lastError: null }),
  setGuidesVisible: (v) => set({ guidesVisible: v }),
  setDocumentGuideCount: (n) => set({ documentGuideCount: n }),
}));
