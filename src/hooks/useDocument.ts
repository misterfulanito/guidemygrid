// src/hooks/useDocument.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { photoshopBridge } from '../services/photoshopBridge';
import { startDocumentWatcher } from '../services/documentWatcher';
import { DocumentInfo, SelectionBounds } from '../types';

interface UseDocumentResult {
  document: DocumentInfo | null;
  selection: SelectionBounds | null;
  loading: boolean;
  refresh: () => void;
}

const DEBOUNCE_MS = 150;

// How often to poll app.activeDocument as a fallback for the case Photoshop does
// NOT notify us about — creating a document via File > New. Reading the active
// document id is a cheap synchronous property access; a full refresh() (which
// enters modal scope for the selection query) only runs when the id changes.
// 1s is imperceptible-enough UX for canvas auto-population while keeping the poll
// negligible on the host's event loop.
const POLL_MS = 1000;

// Photoshop action events that re-sync the active document. These give an
// INSTANT response when they fire, but Photoshop's notification coverage for
// document *creation* (File > New) is unreliable/version-dependent — verified in
// real Photoshop, adding 'make' did NOT make File > New detect the new document
// while the panel was already docked. So these events are a best-effort fast
// path only; the actual guarantee that a new/opened/closed document is detected
// is the app.activeDocument poll wired up below (startDocumentWatcher).
// - 'open'   → File > Open (open an existing document) — this one does fire
// - 'close'  → closing a document
// - 'select' → switching between open documents / layer/object selection
// - 'set'    → pixel selection changes (marching ants)
// - 'make', 'selectAllWithMask', 'deselect' → new doc / select all / deselect
export const DOCUMENT_EVENTS = [
  'make',
  'open',
  'close',
  'select',
  'set',
  'deselect',
  'selectAllWithMask',
];

export function useDocument(): UseDocumentResult {
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [selection, setSelection] = useState<SelectionBounds | null>(null);
  const [loading, setLoading] = useState(true);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const doc = await photoshopBridge.getActiveDocument();
      setDocument(doc);
      if (doc?.hasSelection) {
        const sel = await photoshopBridge.getSelectionBounds();
        setSelection(sel);
      } else {
        setSelection(null);
      }
    } catch (err) {
      console.error('[GMG] useDocument refresh failed:', err);
      setDocument(null);
      setSelection(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    /* eslint-disable @typescript-eslint/no-var-requires */
    const photoshop = require('photoshop');

    const readActiveDocumentId = (): number | null => {
      const doc = photoshop.app.activeDocument;
      if (doc) return doc.id;
      // BONUS (debug session canvas-not-detected): app.documents is a DIFFERENT
      // API surface than app.activeDocument and may list a freshly-created
      // (File > New) document that activeDocument fails to report. Use the most
      // recently added document's id as the change signal so the watcher still
      // fires and wakes refresh(); photoshopBridge.getActiveDocument() has a
      // matching app.documents fallback that resolves the actual dimensions.
      const docs = photoshop.app.documents;
      if (docs && docs.length > 0) {
        const last = docs[docs.length - 1];
        return last ? last.id : null;
      }
      return null;
    };

    // Debounce so rapid triggers (event bursts, or an event + a poll tick landing
    // together) coalesce into a single refresh.
    const scheduleRefresh = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(refresh, DEBOUNCE_MS);
    };

    // Best-effort fast path: refresh immediately on events that DO fire.
    photoshop.action.addNotificationListener(DOCUMENT_EVENTS, scheduleRefresh);

    // Guaranteed path: poll app.activeDocument for id changes so File > New (and
    // anything else Photoshop fails to notify us about) is still detected.
    let initialId: number | null = null;
    try {
      initialId = readActiveDocumentId();
    } catch {
      initialId = null;
    }
    const stopWatcher = startDocumentWatcher({
      readActiveDocumentId,
      onChange: scheduleRefresh,
      intervalMs: POLL_MS,
      initialId,
    });

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      stopWatcher();
      photoshop.action.removeNotificationListener(DOCUMENT_EVENTS, scheduleRefresh);
    };
  }, [refresh]);

  return { document, selection, loading, refresh };
}
