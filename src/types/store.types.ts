/*
 * GuideMyGrid
 * Copyright (c) 2026 Huriata Bonilla Peña. All Rights Reserved.
 *
 * This file is published for viewing and reference only. No permission is
 * granted to use, copy, modify, or distribute this software without the prior
 * written consent of the copyright holder. See the LICENSE file for details.
 */

// src/types/store.types.ts

import { UpdateInfo } from '../services/updateChecker';

export interface ColumnsState {
  count: string;  // '' or numeric string
  gutter: string; // '' or numeric string
}

export interface RowsState {
  count: string;  // '' or numeric string
  gutter: string; // '' or numeric string
}

export interface MarginsState {
  top: string;
  bottom: string;
  left: string;
  right: string;
}

export interface GridStore {
  columns: ColumnsState;
  setColumns: (partial: Partial<ColumnsState>) => void;
  rows: RowsState;
  setRows: (partial: Partial<RowsState>) => void;
  margins: MarginsState;
  setMargins: (partial: Partial<MarginsState>) => void;
}

export interface UIStore {
  guidesVisible: boolean;
  isApplying: boolean;
  lastError: string | null;
  marginsLocked: boolean;
  updateInfo: UpdateInfo | null;
  setGuidesVisible: (v: boolean) => void;
  setApplying: (state: boolean) => void;
  setError: (message: string | null) => void;
  setMarginsLocked: (v: boolean) => void;
  setUpdateInfo: (info: UpdateInfo | null) => void;
  dismissUpdate: () => void;
}
