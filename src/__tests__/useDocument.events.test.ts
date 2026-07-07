// src/__tests__/useDocument.events.test.ts
// Guard for the best-effort fast-path event set in useDocument.
//
// NOTE (debug session `canvas-not-detected`): these notification events are a
// LATENCY optimization only, not the correctness guarantee. Adding 'make' was
// human-verified in real Photoshop and did NOT make File > New detect the new
// document — Photoshop does not reliably notify on document creation. The actual
// guarantee lives in documentWatcher.ts (a poll of app.activeDocument); see
// documentWatcher.test.ts. This file only asserts we keep subscribing to the
// events that DO fire so responsive cases stay instant.

// The 'photoshop' module is supplied by the UXP host at runtime and is NOT an
// npm package, so it will not resolve under Jest. useDocument.ts imports
// photoshopBridge.ts, which does `require('photoshop')` at module load, so we
// virtually mock it here just so the import chain loads.
jest.mock(
  'photoshop',
  () => ({
    app: {
      get activeDocument() {
        return null;
      },
    },
    core: { executeAsModal: jest.fn() },
    action: {
      batchPlay: jest.fn(),
      addNotificationListener: jest.fn(),
      removeNotificationListener: jest.fn(),
    },
  }),
  { virtual: true }
);

import { DOCUMENT_EVENTS } from '../hooks/useDocument';

describe('useDocument document-sync events (best-effort fast path)', () => {
  test('subscribes to document-lifecycle events that DO fire (open / close / switch)', () => {
    for (const evt of ['open', 'close', 'select']) {
      expect(DOCUMENT_EVENTS).toContain(evt);
    }
  });

  test('still covers selection events used to sync selection-based sizing', () => {
    for (const evt of ['set', 'deselect', 'selectAllWithMask']) {
      expect(DOCUMENT_EVENTS).toContain(evt);
    }
  });

  test("keeps 'make' as a harmless best-effort fast path for hosts that do fire it", () => {
    // 'make' did not fix File > New in real Photoshop (the poll in
    // documentWatcher.ts does), but listening for it is harmless and gives an
    // instant refresh on any host/version that happens to dispatch it.
    expect(DOCUMENT_EVENTS).toContain('make');
  });
});
