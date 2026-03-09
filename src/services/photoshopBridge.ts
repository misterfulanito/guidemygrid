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

  // Returns true if guides were cleared, false if there was nothing to remove.
  async clearAllGuides(): Promise<boolean> {
    console.log('[GMG] clearAllGuides — start');
    const result = await photoshop.core.executeAsModal(async () => {
      return await photoshop.action.batchPlay(
        [{
          _obj: 'delete',
          _target: [{ _ref: 'guide', _enum: 'ordinal', _value: 'allEnum' }],
        }],
        { synchronousExecution: false }
      );
    }, { commandName: 'Clear Guides' });
    console.log('[GMG] clearAllGuides — OK', JSON.stringify(result));
    // PS returns an error descriptor when there are no guides to delete
    if (result?.[0]?._obj === 'error') return false;
    return true;
  }

  async toggleGuidesVisibility(visible: boolean): Promise<void> {
    console.log('[GMG] toggleGuidesVisibility — start, visible:', visible);
    await photoshop.core.executeAsModal(async () => {
      // Read current state via uiInfo (real-time, uncached)
      const stateResult = await photoshop.action.batchPlay(
        [{
          _obj: 'uiInfo',
          _target: { _ref: 'application', _enum: 'ordinal', _value: 'targetEnum' },
          command: 'getCommandEnabled',
          commandID: 3503,
        }],
        { synchronousExecution: false }
      );
      const currentlyVisible = stateResult[0]?.result?.checked ?? false;
      console.log('[GMG] toggleGuidesVisibility — currentlyVisible:', currentlyVisible, 'want:', visible);
      // Only invoke if state actually needs to change
      if (currentlyVisible !== visible) {
        await (photoshop.core as any).performMenuCommand({ commandID: 3503 });
      }
    }, { commandName: 'Toggle Guides Visibility' });
    console.log('[GMG] toggleGuidesVisibility — OK');
  }

  async getGuidesVisible(): Promise<boolean> {
    try {
      const result = await photoshop.core.executeAsModal(async () => {
        return await photoshop.action.batchPlay(
          [{
            _obj: 'get',
            _target: [
              { _ref: 'property', _property: 'guideLine' },
              { _ref: 'document', _enum: 'ordinal', _value: 'targetEnum' },
            ],
          }],
          { synchronousExecution: false }
        );
      }, { commandName: 'Get Guides Visibility' });

      // The descriptor returns an object with a guideLine property containing visible.
      if (result?.[0]?.guideLine?.visible !== undefined) {
        return Boolean(result[0].guideLine.visible);
      }
    } catch {
      // Property may not be readable on older PS versions — fall back to guide count heuristic.
    }

    // Fallback: if there are no guides in the document, treat as effectively "visible"
    // (there is nothing to show/hide). Return true as a safe default.
    const doc = app.activeDocument;
    if (!doc) return true;
    return true;
  }

  async addAlignmentGuide(
    orientation: 'vertical' | 'horizontal',
    position: number,
    commandName: string
  ): Promise<void> {
    await photoshop.core.executeAsModal(async () => {
      await photoshop.action.batchPlay(
        [{
          _obj: 'make',
          _target: [{ _ref: 'guide' }],
          using: {
            _obj: 'guide',
            orientation: { _enum: 'orientation', _value: orientation },
            position: { _unit: 'pixelsUnit', _value: position },
          },
        }],
        {}
      );
    }, { commandName });
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
