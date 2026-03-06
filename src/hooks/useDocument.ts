// src/hooks/useDocument.ts
import { useState, useEffect, useCallback } from 'react';
import { photoshopBridge } from '../services/photoshopBridge';
import { DocumentInfo, SelectionBounds } from '../types';

interface UseDocumentResult {
  document: DocumentInfo | null;
  selection: SelectionBounds | null;
  loading: boolean;
  refresh: () => void;
}

export function useDocument(): UseDocumentResult {
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [selection, setSelection] = useState<SelectionBounds | null>(null);
  const [loading, setLoading] = useState(true);

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
    } catch {
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

    // 'select' cubre cambios de documento y selección de capas/objetos
    // 'set' cubre cambios de selección de píxeles (marching ants)
    // 'selectAllWithMask', 'deselect' cubren seleccionar todo / deseleccionar
    const events = ['select', 'open', 'close', 'set', 'deselect', 'selectAllWithMask'];
    const listener = () => { refresh(); };
    photoshop.action.addNotificationListener(events, listener);

    return () => {
      photoshop.action.removeNotificationListener(events, listener);
    };
  }, [refresh]);

  return { document, selection, loading, refresh };
}
