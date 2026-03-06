// src/components/Presets/Presets.tsx
import React, { useState } from 'react';
import { useGridStore, usePresetsStore } from '../../store';
import { PresetItem } from './PresetItem';
import styles from './Presets.module.css';

export function Presets() {
  const config = useGridStore((s) => s.config);
  const { presets, addPreset, deletePreset, applyPreset } = usePresetsStore();
  const [name, setName] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addPreset(trimmed, config);
    setName('');
  };

  const builtIns = presets.filter((p) => p.isBuiltIn);
  const custom = presets.filter((p) => !p.isBuiltIn);

  return (
    <div className={styles.panel}>
      {/* Save current config */}
      <div className={styles.saveForm}>
        <sp-textfield
          class={styles.saveInput}
          placeholder="Nombre del preset…"
          value={name}
          onInput={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.currentTarget.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
            if (e.key === 'Enter') handleSave();
          }}
        />
        <sp-button
          variant="primary"
          size="s"
          class={styles.saveBtn}
          disabled={(!name.trim()) || undefined}
          onClick={handleSave}
        >
          Guardar
        </sp-button>
      </div>

      <sp-divider size="s" />

      {/* Built-in presets */}
      {builtIns.length > 0 && (
        <div className={styles.list}>
          {builtIns.map((p) => (
            <PresetItem key={p.id} preset={p} onApply={applyPreset} onDelete={deletePreset} />
          ))}
        </div>
      )}

      {/* Custom presets */}
      {custom.length > 0 ? (
        <div className={styles.list}>
          {custom.map((p) => (
            <PresetItem key={p.id} preset={p} onApply={applyPreset} onDelete={deletePreset} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          Guarda tu configuración actual para reutilizarla después.
        </p>
      )}
    </div>
  );
}
