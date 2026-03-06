// src/components/shared/ApplyButton.tsx
import React from 'react';
import { useGridStore } from '../../store';
import { useUIStore } from '../../store';
import { useDocument } from '../../hooks/useDocument';
import { photoshopBridge } from '../../services/photoshopBridge';
import { generateGuides, GridGenerationError } from '../../services/gridGenerator';

// No recibe props — lee el estado de los stores directamente
export function ApplyButton() {
  const config = useGridStore((s) => s.config);
  const { document } = useDocument();
  const { isApplying, setApplying, setError, setSuccess } = useUIStore();

  const handleApply = async () => {
    if (!document) return;
    setApplying(true);
    try {
      const guides = generateGuides(config, {
        width: document.width,
        height: document.height,
      });
      await photoshopBridge.applyGuides(guides, config.applyMode);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aplicar el grid');
    } finally {
      setApplying(false);
    }
  };

  const label = isApplying
    ? 'Aplicando...'
    : config.applyMode === 'replace'
      ? 'Reemplazar guías'
      : 'Agregar guías';

  return (
    <sp-button
      variant="cta"
      disabled={!document || isApplying || undefined}
      onClick={handleApply}
    >
      {label}
    </sp-button>
  );
}
