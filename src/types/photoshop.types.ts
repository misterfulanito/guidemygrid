// src/types/photoshop.types.ts

import { GuideOrientation } from './grid.types';

export interface DocumentInfo {
  id: number;
  name: string;
  width: number;            // px
  height: number;           // px
  resolution: number;       // dpi (dots per inch)
  hasSelection: boolean;
}

export interface SelectionBounds {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
}

export interface GuideInfo {
  position: number;         // px
  orientation: GuideOrientation;
}

export interface DocumentContext {
  document: DocumentInfo;
  selection: SelectionBounds | null;
  guides: GuideInfo[];
}
