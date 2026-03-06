// src/services/photoshopBridge.ts
// UXP provee estos módulos via require() — no son npm packages

/* eslint-disable @typescript-eslint/no-var-requires */
const photoshop = require('photoshop');
const app = photoshop.app;

import { DocumentInfo, SelectionBounds, GuideInfo, GeneratedGuides, ApplyMode, GuideOrientation } from '../types';

export class PhotoshopBridge {

  // --- Documento activo ---

  async getActiveDocument(): Promise<DocumentInfo | null> {
    const doc = app.activeDocument;
    if (!doc) return null;
    return {
      id: doc.id,
      name: doc.name,
      width: doc.width,
      height: doc.height,
      resolution: doc.resolution,
      hasSelection: await this.hasActiveSelection(),
    };
  }

  // --- Selección ---

  async getSelectionBounds(): Promise<SelectionBounds | null> {
    const doc = app.activeDocument;
    if (!doc) return null;

    const result = await photoshop.core.executeAsModal(async () => {
      return await photoshop.action.batchPlay(
        [{ _obj: 'get', _target: [{ _property: 'selection' }, { _ref: 'document', _enum: 'ordinal', _value: 'targetEnum' }] }],
        {}
      );
    }, { commandName: 'Get Selection' });

    if (!result?.[0]?.selection) return null;
    const sel = result[0].selection;
    return {
      top: sel.top._value,
      left: sel.left._value,
      bottom: sel.bottom._value,
      right: sel.right._value,
      width: sel.right._value - sel.left._value,
      height: sel.bottom._value - sel.top._value,
    };
  }

  private async hasActiveSelection(): Promise<boolean> {
    const bounds = await this.getSelectionBounds();
    return bounds !== null;
  }

  // --- Guías ---

  async getAllGuides(): Promise<GuideInfo[]> {
    const doc = app.activeDocument;
    if (!doc) return [];
    return doc.guides.map((g: { position: number; direction: string }) => ({
      position: g.position,
      orientation: (g.direction === 'horizontal' ? 'horizontal' : 'vertical') as GuideOrientation,
    }));
  }

  async clearAllGuides(): Promise<void> {
    await photoshop.core.executeAsModal(async () => {
      await photoshop.action.batchPlay(
        [{ _obj: 'clearGuides', _target: [{ _ref: 'document', _enum: 'ordinal', _value: 'targetEnum' }] }],
        {}
      );
    }, { commandName: 'Clear Guides' });
  }

  async addGuide(position: number, orientation: GuideOrientation): Promise<void> {
    await photoshop.core.executeAsModal(async () => {
      await photoshop.action.batchPlay(
        [{
          _obj: 'make',
          _target: [{ _ref: 'guide' }],
          new: {
            _obj: 'guide',
            position: { _unit: 'pixelsUnit', _value: position },
            kind: orientation === 'vertical'
              ? { _enum: 'orientation', _value: 'vertical' }
              : { _enum: 'orientation', _value: 'horizontal' },
          },
        }],
        {}
      );
    }, { commandName: 'Add Guide' });
  }

  // --- Aplicación de grids ---

  async applyGuides(guides: GeneratedGuides, mode: ApplyMode): Promise<void> {
    const doc = app.activeDocument;
    if (!doc) throw new Error('No hay documento activo en Photoshop');

    await photoshop.core.executeAsModal(async () => {
      // Clear existing guides first (ignore error if there are none)
      if (mode === 'replace') {
        try {
          await photoshop.action.batchPlay(
            [{ _obj: 'clearGuides', _target: [{ _ref: 'document', _enum: 'ordinal', _value: 'targetEnum' }] }],
            { synchronousExecution: false }
          );
        } catch { /* no guides to clear */ }
      }

      // Build all guide descriptors in one batch call
      const descriptors = [
        ...guides.vertical.map((x) => ({
          _obj: 'make',
          _target: [{ _ref: 'guide' }],
          new: {
            _obj: 'guide',
            position: { _unit: 'pixelsUnit', _value: x },
            orientation: { _enum: 'orientation', _value: 'vertical' },
          },
        })),
        ...guides.horizontal.map((y) => ({
          _obj: 'make',
          _target: [{ _ref: 'guide' }],
          new: {
            _obj: 'guide',
            position: { _unit: 'pixelsUnit', _value: y },
            orientation: { _enum: 'orientation', _value: 'horizontal' },
          },
        })),
      ];

      if (descriptors.length > 0) {
        await photoshop.action.batchPlay(descriptors, { synchronousExecution: false });
      }
    }, { commandName: 'Apply GuideMyGrid' });
  }
}

export const photoshopBridge = new PhotoshopBridge();
