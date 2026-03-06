// src/components/Presets/PresetItem.tsx
import React from 'react';
import { Preset } from '../../types';
import styles from './Presets.module.css';

interface PresetItemProps {
  preset: Preset;
  onApply: (id: string) => void;
  onDelete: (id: string) => void;
}

function PresetIcon() {
  return (
    <svg className={styles.itemIconSvg} viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="2.5" height="12" rx="0.5"/>
      <rect x="5.75" y="1" width="2.5" height="12" rx="0.5"/>
      <rect x="10.5" y="1" width="2.5" height="12" rx="0.5"/>
    </svg>
  );
}

function buildMeta(preset: Preset): string {
  const { columns, rows } = preset.config;
  const parts: string[] = [];
  if (columns.enabled) parts.push(`${columns.columns} col`);
  if (rows.enabled) parts.push(`${rows.rows} fil`);
  if (parts.length === 0) parts.push('sin guías');
  return parts.join(' · ');
}

export function PresetItem({ preset, onApply, onDelete }: PresetItemProps) {
  return (
    <div className={styles.item} onClick={() => onApply(preset.id)}>
      <div className={styles.itemIcon}>
        <PresetIcon />
      </div>

      <div className={styles.itemInfo}>
        <div className={styles.itemName}>{preset.name}</div>
        <div className={styles.itemMeta}>{buildMeta(preset)}</div>
      </div>

      {preset.isBuiltIn && (
        <span className={styles.itemBadge}>Built-in</span>
      )}

      {!preset.isBuiltIn && (
        <button
          className={styles.itemDelete}
          title="Eliminar preset"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(preset.id);
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}
