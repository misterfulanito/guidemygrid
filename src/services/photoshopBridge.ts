// src/services/photoshopBridge.ts
// UXP provides these modules via require() — they are not npm packages

/* eslint-disable @typescript-eslint/no-var-requires */
const photoshop = require('photoshop');
const app = photoshop.app;

import { DocumentInfo, SelectionBounds, GuideInfo, GeneratedGuides, ApplyMode, GuideOrientation } from '../types';

export class PhotoshopBridge {

  // --- Active document ---

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

  // --- Selection ---

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

  // --- Guides ---

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
    const result = await photoshop.core.executeAsModal(async () => {
      return await photoshop.action.batchPlay(
        [{
          _obj: 'delete',
          _target: [{ _ref: 'guide', _enum: 'ordinal', _value: 'allEnum' }],
        }],
        { synchronousExecution: false }
      );
    }, { commandName: 'Clear Guides' });
    // PS returns an error descriptor when there are no guides to delete
    if (result?.[0]?._obj === 'error') return false;
    return true;
  }

  async toggleGuidesVisibility(visible: boolean): Promise<void> {
    await photoshop.core.executeAsModal(async () => {
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
      // Only invoke if state actually needs to change
      if (currentlyVisible !== visible) {
        await (photoshop.core as any).performMenuCommand({ commandID: 3503 });
      }
    }, { commandName: 'Toggle Guides Visibility' });
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

      if (result?.[0]?.guideLine?.visible !== undefined) {
        return Boolean(result[0].guideLine.visible);
      }
    } catch (err) {
      // Property may not be readable on older PS versions — fall back to true.
      console.error('[GMG] getGuidesVisible fallback:', err);
    }

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
            orientation: { _enum: 'orientation', _value: orientation },
          },
        }],
        {}
      );
    }, { commandName: 'Add Guide' });
  }

  // --- Grid application ---

  async applyGuides(guides: GeneratedGuides, mode: ApplyMode): Promise<void> {
    const doc = app.activeDocument;
    if (!doc) throw new Error('No active document in Photoshop');

    await photoshop.core.executeAsModal(async () => {
      if (mode === 'replace') {
        try {
          await photoshop.action.batchPlay(
            [{ _obj: 'clearGuides', _target: [{ _ref: 'document', _enum: 'ordinal', _value: 'targetEnum' }] }],
            { synchronousExecution: false }
          );
        } catch {
          // Expected when the document has no existing guides — safe to ignore.
        }
      }

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
