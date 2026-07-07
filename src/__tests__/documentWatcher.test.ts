// src/__tests__/documentWatcher.test.ts
//
// Regression guard for debug session `canvas-not-detected`.
//
// THE BUG: creating a document via File > New while the GuideMyGrid panel is
// already docked did not populate the Canvas W/H. Photoshop fired no listened
// notification for the new document, so refresh() never re-ran. Adding a 'make'
// event listener was human-verified in real Photoshop and did NOT fix it, so the
// fix must not depend on any Photoshop event name.
//
// THE FIX (what this file guards): startDocumentWatcher polls the active document
// id and fires onChange when it changes — driven purely by app.activeDocument, no
// notification event required. These tests exercise that REAL behavior with fake
// timers and a mutable id source, including the exact File > New scenario:
// a document appears after mount with NO event, and the watcher must catch it.

import { startDocumentWatcher } from '../services/documentWatcher';

describe('startDocumentWatcher', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('detects a document that appears after mount (File > New) with no event', () => {
    let currentId: number | null = null; // panel docked, no document open
    const onChange = jest.fn();
    const stop = startDocumentWatcher({
      readActiveDocumentId: () => currentId,
      onChange,
      intervalMs: 1000,
      initialId: null,
    });

    // No document yet: several ticks pass, nothing happens.
    jest.advanceTimersByTime(3000);
    expect(onChange).not.toHaveBeenCalled();

    // User does File > New. Photoshop fires NO listened event, but
    // app.activeDocument now has an id. The poll must catch it.
    currentId = 42;
    jest.advanceTimersByTime(1000);
    expect(onChange).toHaveBeenCalledTimes(1);

    stop();
  });

  test('does not re-fire while the same document stays active', () => {
    let currentId: number | null = 7;
    const onChange = jest.fn();
    const stop = startDocumentWatcher({
      readActiveDocumentId: () => currentId,
      onChange,
      intervalMs: 500,
      initialId: 7, // already active at mount → no redundant fire
    });

    jest.advanceTimersByTime(5000);
    expect(onChange).not.toHaveBeenCalled();

    stop();
  });

  test('fires on document switch and on closing the last document', () => {
    let currentId: number | null = 1;
    const onChange = jest.fn();
    const stop = startDocumentWatcher({
      readActiveDocumentId: () => currentId,
      onChange,
      intervalMs: 500,
      initialId: 1,
    });

    currentId = 2; // switch to another open document
    jest.advanceTimersByTime(500);
    expect(onChange).toHaveBeenCalledTimes(1);

    currentId = null; // close the last document
    jest.advanceTimersByTime(500);
    expect(onChange).toHaveBeenCalledTimes(2);

    stop();
  });

  test('survives a transient read error and recovers on the next tick', () => {
    let mode: 'null' | 'throw' | 'doc' = 'null';
    const onChange = jest.fn();
    const stop = startDocumentWatcher({
      readActiveDocumentId: () => {
        if (mode === 'throw') throw new Error('host busy');
        return mode === 'doc' ? 99 : null;
      },
      onChange,
      intervalMs: 500,
      initialId: null,
    });

    mode = 'throw';
    jest.advanceTimersByTime(500);
    expect(onChange).not.toHaveBeenCalled(); // error swallowed, no crash

    mode = 'doc';
    jest.advanceTimersByTime(500);
    expect(onChange).toHaveBeenCalledTimes(1); // recovered, detects the doc

    stop();
  });

  test('stop() halts polling', () => {
    let currentId: number | null = null;
    const onChange = jest.fn();
    const stop = startDocumentWatcher({
      readActiveDocumentId: () => currentId,
      onChange,
      intervalMs: 500,
      initialId: null,
    });

    stop();
    currentId = 5; // a document appears AFTER we stopped watching
    jest.advanceTimersByTime(5000);
    expect(onChange).not.toHaveBeenCalled();
  });
});
