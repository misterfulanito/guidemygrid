// src/services/gridGenerator.ts

import { GridConfig, GeneratedGuides } from '../types';

export class GridGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GridGenerationError';
  }
}

export function generateGuides(
  config: GridConfig,
  context: { width: number; height: number; offsetX?: number; offsetY?: number }
): GeneratedGuides {
  const { width, height, offsetX = 0, offsetY = 0 } = context;
  const vertical: number[] = [];
  const horizontal: number[] = [];

  // --- Columnas ---
  if (config.columns.enabled) {
    const { columns, gutter, marginLeft, marginRight, columnWidth, columnWidthValue } = config.columns;
    const availableWidth = width - marginLeft - marginRight;

    if (availableWidth <= 0) {
      throw new GridGenerationError(
        `Los márgenes (${marginLeft + marginRight}px) superan el ancho del documento (${width}px)`
      );
    }

    const colWidth =
      columnWidth === 'fixed'
        ? columnWidthValue
        : (availableWidth - gutter * (columns - 1)) / columns;

    if (colWidth <= 0) {
      throw new GridGenerationError(
        `El gutter o número de columnas genera columnas de ancho negativo`
      );
    }

    for (let i = 0; i < columns; i++) {
      const left = offsetX + marginLeft + i * (colWidth + gutter);
      const right = left + colWidth;
      vertical.push(Math.round(left * 100) / 100);
      vertical.push(Math.round(right * 100) / 100);
    }
  }

  // --- Filas ---
  if (config.rows.enabled) {
    const { rows, gutter, marginTop, marginBottom, rowHeight, rowHeightValue } = config.rows;
    const availableHeight = height - marginTop - marginBottom;

    if (availableHeight <= 0) {
      throw new GridGenerationError(
        `Los márgenes verticales superan la altura del documento`
      );
    }

    const rHeight =
      rowHeight === 'fixed'
        ? rowHeightValue
        : (availableHeight - gutter * (rows - 1)) / rows;

    if (rHeight <= 0) {
      throw new GridGenerationError(
        `El gutter o número de filas genera filas de alto negativo`
      );
    }

    for (let i = 0; i < rows; i++) {
      const top = offsetY + marginTop + i * (rHeight + gutter);
      const bottom = top + rHeight;
      horizontal.push(Math.round(top * 100) / 100);
      horizontal.push(Math.round(bottom * 100) / 100);
    }
  }

  // --- Márgenes simples ---
  if (config.margins.enabled) {
    const { top, right, bottom, left } = config.margins;
    horizontal.push(offsetY + top);
    horizontal.push(offsetY + height - bottom);
    vertical.push(offsetX + left);
    vertical.push(offsetX + width - right);
  }

  return {
    vertical: [...new Set(vertical)].sort((a, b) => a - b),
    horizontal: [...new Set(horizontal)].sort((a, b) => a - b),
  };
}
