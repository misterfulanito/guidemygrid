/*
 * GuideMyGrid
 * Copyright (c) 2026 Huriata Bonilla Peña. All Rights Reserved.
 *
 * This file is published for viewing and reference only. No permission is
 * granted to use, copy, modify, or distribute this software without the prior
 * written consent of the copyright holder. See the LICENSE file for details.
 */

// src/services/documentWatcher.ts
//
// Polls the active document id and invokes a callback whenever it changes.
//
// WHY THIS EXISTS
// ---------------
// Photoshop's UXP action notifications do NOT reliably fire for File > New
// (verified in real Photoshop: adding a 'make' listener to useDocument did NOT
// make a newly created document detectable while the panel was already docked;
// File > Open, which fires 'open', works fine). Rather than keep guessing
// Photoshop's internal event names — a guess that has already failed once — we
// watch the active document id directly. Reading the id is a cheap synchronous
// property access; the expensive modal work (selection query) happens inside the
// onChange handler, only when the document actually changes.
//
// This module is intentionally free of any UXP/photoshop dependency so it can be
// unit-tested with fake timers and a plain mock — see documentWatcher.test.ts.

export interface DocumentWatcherOptions {
  // Reads the current active document id, or null when no document is open.
  // May throw on transient host errors (e.g. mid-operation); the watcher
  // swallows the error and retries on the next tick.
  readActiveDocumentId: () => number | null;
  // Invoked whenever the active document id changes (new / open / close / switch).
  onChange: () => void;
  // Poll interval in milliseconds.
  intervalMs: number;
  // Baseline id captured synchronously at start, so the first tick does not fire
  // a redundant onChange for the document that was already active at mount.
  initialId: number | null;
}

// Starts polling. Returns a stop() function that clears the interval.
export function startDocumentWatcher(options: DocumentWatcherOptions): () => void {
  const { readActiveDocumentId, onChange, intervalMs, initialId } = options;
  let lastSeenId: number | null = initialId;

  const timer = setInterval(() => {
    let currentId: number | null;
    try {
      currentId = readActiveDocumentId();
    } catch {
      // Transient host state — try again on the next tick.
      return;
    }
    if (currentId !== lastSeenId) {
      lastSeenId = currentId;
      onChange();
    }
  }, intervalMs);

  return () => clearInterval(timer);
}
