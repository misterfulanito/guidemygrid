/*
 * GuideMyGrid
 * Copyright (c) 2026 Huriata Bonilla Peña. All Rights Reserved.
 *
 * This file is published for viewing and reference only. No permission is
 * granted to use, copy, modify, or distribute this software without the prior
 * written consent of the copyright holder. See the LICENSE file for details.
 */

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
