// src/hooks/useDocument.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { photoshopBridge } from '../services/photoshopBridge';
import { DocumentInfo, SelectionBounds } from '../types';

interface UseDocumentResult {
  document: DocumentInfo | null;
  selection: SelectionBounds | null;
  loading: boolean;
  refresh: () => void;
}

const DEBOUNCE_MS = 150;

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

    // 'select' covers document changes and layer/object selection
    // 'set' covers pixel selection changes (marching ants)
    // 'selectAllWithMask', 'deselect' cover select all / deselect
    const events = ['select', 'open', 'close', 'set', 'deselect', 'selectAllWithMask'];

    // Debounce to avoid flooding batchPlay on rapid events (e.g. layer selections)
    const listener = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(refresh, DEBOUNCE_MS);
    };

    photoshop.action.addNotificationListener(events, listener);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      photoshop.action.removeNotificationListener(events, listener);
    };
  }, [refresh]);

  return { document, selection, loading, refresh };
}
