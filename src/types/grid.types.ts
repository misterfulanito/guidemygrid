// src/types/grid.types.ts

export type WidthMode = 'auto' | 'fixed';
export type GuideOrientation = 'horizontal' | 'vertical';
export type ApplyTarget = 'canvas' | 'selection';
export type ApplyMode = 'replace' | 'add';

export interface ColumnConfig {
  enabled: boolean;
  columns: number;          // 1–24
  columnWidth: WidthMode;   // 'auto' or fixed value
  columnWidthValue: number; // px, used only if columnWidth === 'fixed'
  gutter: number;           // px between columns
  marginLeft: number;       // offset from left edge
  marginRight: number;      // offset from right edge
}

export interface RowConfig {
  enabled: boolean;
  rows: number;             // 1–100
  rowHeight: WidthMode;
  rowHeightValue: number;   // px, used only if rowHeight === 'fixed'
  gutter: number;           // px between rows
  marginTop: number;
  marginBottom: number;
}

export interface MarginsConfig {
  enabled: boolean;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface GridConfig {
  columns: ColumnConfig;
  rows: RowConfig;
  margins: MarginsConfig;
  applyTarget: ApplyTarget;
  applyMode: ApplyMode;
}

export interface GuidePosition {
  position: number;         // px from the document/selection origin
  orientation: GuideOrientation;
}

export interface GeneratedGuides {
  vertical: number[];       // absolute x positions (px)
  horizontal: number[];     // absolute y positions (px)
}

export const DEFAULT_COLUMN_CONFIG: ColumnConfig = {
  enabled: true,
  columns: 12,
  columnWidth: 'auto',
  columnWidthValue: 80,
  gutter: 20,
  marginLeft: 0,
  marginRight: 0,
};

export const DEFAULT_ROW_CONFIG: RowConfig = {
  enabled: false,
  rows: 8,
  rowHeight: 'auto',
  rowHeightValue: 80,
  gutter: 0,
  marginTop: 0,
  marginBottom: 0,
};

export const DEFAULT_MARGINS_CONFIG: MarginsConfig = {
  enabled: false,
  top: 40,
  right: 40,
  bottom: 40,
  left: 40,
};

export const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: DEFAULT_COLUMN_CONFIG,
  rows: DEFAULT_ROW_CONFIG,
  margins: DEFAULT_MARGINS_CONFIG,
  applyTarget: 'canvas',
  applyMode: 'replace',
};
