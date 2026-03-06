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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSave();
  };

  const builtIns = presets.filter((p) => p.isBuiltIn);
  const custom = presets.filter((p) => !p.isBuiltIn);

  return (
    <div className={styles.panel}>
      {/* Save current config */}
      <div className={styles.saveForm}>
        <input
          className={styles.saveInput}
          type="text"
          placeholder="Nombre del preset…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={40}
        />
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!name.trim()}
        >
          Guardar
        </button>
      </div>

      <div className={styles.divider} />

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
