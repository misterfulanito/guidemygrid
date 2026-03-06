// src/hooks/useDocument.ts
import { useState, useEffect } from 'react';
import { photoshopBridge } from '../services/photoshopBridge';
import { DocumentInfo } from '../types';

export function useDocument() {
  const [document, setDocument] = useState<DocumentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      const doc = await photoshopBridge.getActiveDocument();
      setDocument(doc);
      setLoading(false);
    };

    refresh();

    // Escuchar cambios de documento activo en PS
    /* eslint-disable @typescript-eslint/no-var-requires */
    const photoshop = require('photoshop');
    const listener = () => { refresh(); };
    photoshop.action.addNotificationListener(['select', 'open', 'close'], listener);

    return () => {
      photoshop.action.removeNotificationListener(['select', 'open', 'close'], listener);
    };
  }, []);

  return { document, loading };
}
