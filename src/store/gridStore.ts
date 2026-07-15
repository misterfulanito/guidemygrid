/*
 * GuideMyGrid
 * Copyright (c) 2026 Huriata Bonilla Peña. All Rights Reserved.
 *
 * This file is published for viewing and reference only. No permission is
 * granted to use, copy, modify, or distribute this software without the prior
 * written consent of the copyright holder. See the LICENSE file for details.
 */

// src/store/gridStore.ts
import { create } from 'zustand';
import { GridStore } from '../types';

export const useGridStore = create<GridStore>((set) => ({
  columns: { count: '', gutter: '' },

  setColumns: (partial) =>
    set((state) => ({ columns: { ...state.columns, ...partial } })),

  rows: { count: '', gutter: '' },
  setRows: (partial) =>
    set((state) => ({ rows: { ...state.rows, ...partial } })),

  margins: { top: '', bottom: '', left: '', right: '' },
  setMargins: (partial) =>
    set((state) => ({ margins: { ...state.margins, ...partial } })),
}));
