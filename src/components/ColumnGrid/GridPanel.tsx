// src/components/ColumnGrid/GridPanel.tsx
import React, { useEffect, useState } from 'react';
import { useGridStore, useUIStore } from '../../store';
import { useDocument } from '../../hooks/useDocument';
import { photoshopBridge } from '../../services/photoshopBridge';
import { generateGuides, GridGenerationError } from '../../services/gridGenerator';
import { VERSION } from '../../version';
import styles from './GridPanel.module.css';

// ── SVG icons ────────────────────────────────────────────────────────────────

function IconMargins() {
  return (
    <svg className={styles.sectionIcon} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="10" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="3" y="3" width="6" height="6" fill="currentColor" opacity="0.25"/>
    </svg>
  );
}

function IconColumns() {
  return (
    <svg className={styles.sectionIcon} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="2.5" height="10" rx="0.5" fill="currentColor"/>
      <rect x="4.75" y="1" width="2.5" height="10" rx="0.5" fill="currentColor"/>
      <rect x="8.5" y="1" width="2.5" height="10" rx="0.5" fill="currentColor"/>
    </svg>
  );
}

function IconRows() {
  return (
    <svg className={styles.sectionIcon} viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="10" height="2.5" rx="0.5" fill="currentColor"/>
      <rect x="1" y="4.75" width="10" height="2.5" rx="0.5" fill="currentColor"/>
      <rect x="1" y="8.5" width="10" height="2.5" rx="0.5" fill="currentColor"/>
    </svg>
  );
}

// ── Labeled number input ─────────────────────────────────────────────────────

interface LabeledInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (v: number) => void;
}

function LabeledInput({ label, value, min, max, disabled, onChange }: LabeledInputProps) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => { setRaw(String(value)); }, [value]);

  const commit = () => {
    const n = parseFloat(raw);
    if (!isNaN(n)) {
      let clamped = n;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      onChange(clamped);
      setRaw(String(clamped));
    } else {
      setRaw(String(value));
    }
  };

  return (
    <div className={styles.inputGroup}>
      <span className={styles.inputLabel}>{label}</span>
      <input
        type="number"
        className={styles.inputField}
        value={raw}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      />
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  enabled: boolean;
  onToggle: () => void;
}

function SectionHeader({ icon, title, enabled, onToggle }: SectionHeaderProps) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.sectionTitle}>{icon}{title}</span>
      <sp-switch checked={enabled || undefined} onClick={onToggle} />
    </div>
  );
}

// ── GridPanel ─────────────────────────────────────────────────────────────────

export function GridPanel() {
  const { config, setColumnConfig, setRowConfig, setMarginsConfig, setApplyTarget, setApplyMode } = useGridStore();
  const { columns, rows, margins, applyTarget, applyMode } = config;
  const { isApplying, lastError, lastSuccess, setApplying, setError, setSuccess } = useUIStore();
  const { document, selection, refresh } = useDocument();

  // Auto-revert applyTarget to 'canvas' when selection disappears
  useEffect(() => {
    if (!selection && applyTarget === 'selection') {
      setApplyTarget('canvas');
    }
  }, [selection, applyTarget, setApplyTarget]);

  // Clear success message after 2 s
  useEffect(() => {
    if (!lastSuccess) return;
    const t = setTimeout(() => setSuccess(false), 2000);
    return () => clearTimeout(t);
  }, [lastSuccess, setSuccess]);

  const handleApply = async () => {
    if (!document || isApplying) return;
    setApplying(true);
    setError(null);
    setSuccess(false);
    try {
      const ctx =
        applyTarget === 'selection' && selection
          ? { width: selection.width, height: selection.height, offsetX: selection.left, offsetY: selection.top }
          : { width: document.width, height: document.height };
      const guides = generateGuides(config, ctx);
      await photoshopBridge.applyGuides(guides, applyMode);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof GridGenerationError ? err.message : 'Error al aplicar guías');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className={styles.panel}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>GuideMyGrid</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className={styles.headerVersion}>v{VERSION}</span>
          <button className={styles.refreshBtn} onClick={refresh} title="Actualizar estado">↻</button>
        </div>
      </div>

      {/* ── Status banner ── */}
      {!document ? (
        <div className={styles.noDocBanner}>
          <span>◦</span>
          Abre un documento en Photoshop
        </div>
      ) : selection ? (
        <div className={styles.selectionBanner}>
          <span className={styles.selectionBannerDot} />
          Selección activa
          <span className={styles.selectionMeta}>
            {Math.round(selection.width)} × {Math.round(selection.height)} px
          </span>
        </div>
      ) : null}

      {/* ── Scrollable sections ── */}
      <div className={styles.content}>

        {/* Márgenes */}
        <div className={styles.section}>
          <SectionHeader icon={<IconMargins />} title="Márgenes" enabled={margins.enabled}
            onToggle={() => setMarginsConfig({ enabled: !margins.enabled })} />
          {margins.enabled && (
            <div className={styles.marginsGrid}>
              <LabeledInput label="Arriba" value={margins.top} min={0} max={2000}
                onChange={(v) => setMarginsConfig({ top: v })} />
              <LabeledInput label="Derecha" value={margins.right} min={0} max={2000}
                onChange={(v) => setMarginsConfig({ right: v })} />
              <LabeledInput label="Abajo" value={margins.bottom} min={0} max={2000}
                onChange={(v) => setMarginsConfig({ bottom: v })} />
              <LabeledInput label="Izquierda" value={margins.left} min={0} max={2000}
                onChange={(v) => setMarginsConfig({ left: v })} />
            </div>
          )}
        </div>

        {/* Columnas */}
        <div className={styles.section}>
          <SectionHeader icon={<IconColumns />} title="Columnas" enabled={columns.enabled}
            onToggle={() => setColumnConfig({ enabled: !columns.enabled })} />
          {columns.enabled && (
            <div className={styles.inputRow}>
              <LabeledInput label="Cantidad" value={columns.columns} min={1} max={24}
                onChange={(v) => setColumnConfig({ columns: v })} />
              <LabeledInput label="Gutter" value={columns.gutter} min={0} max={500}
                onChange={(v) => setColumnConfig({ gutter: v })} />
              <LabeledInput label="Margen" value={columns.marginLeft} min={0} max={2000}
                onChange={(v) => setColumnConfig({ marginLeft: v, marginRight: v })} />
            </div>
          )}
        </div>

        {/* Filas */}
        <div className={styles.section}>
          <SectionHeader icon={<IconRows />} title="Filas" enabled={rows.enabled}
            onToggle={() => setRowConfig({ enabled: !rows.enabled })} />
          {rows.enabled && (
            <div className={styles.inputRow}>
              <LabeledInput label="Filas" value={rows.rows} min={1} max={100}
                onChange={(v) => setRowConfig({ rows: v })} />
              <LabeledInput label="Gutter" value={rows.gutter} min={0} max={500}
                onChange={(v) => setRowConfig({ gutter: v })} />
              <LabeledInput label="Margen" value={rows.marginTop} min={0} max={2000}
                onChange={(v) => setRowConfig({ marginTop: v, marginBottom: v })} />
            </div>
          )}
        </div>

      </div>

      {/* ── Apply footer ── */}
      <div className={styles.applySection}>

        <span className={styles.applyLabel}>Aplicar en</span>
        <div className={styles.segmented}>
          <button
            className={`${styles.segmentedBtn} ${applyTarget === 'canvas' ? styles.segmentedBtnActive : ''}`}
            onClick={() => setApplyTarget('canvas')}
          >
            Canvas
          </button>
          <button
            className={`${styles.segmentedBtn} ${applyTarget === 'selection' ? styles.segmentedBtnActive : ''}`}
            disabled={!selection}
            onClick={() => setApplyTarget('selection')}
            title={!selection ? 'Haz una selección en Photoshop para usar esta opción' : undefined}
          >
            Selección
          </button>
        </div>

        <span className={styles.applyLabel}>Modo</span>
        <div className={styles.segmented}>
          <button
            className={`${styles.segmentedBtn} ${applyMode === 'replace' ? styles.segmentedBtnActiveDark : ''}`}
            onClick={() => setApplyMode('replace')}
          >
            Reemplazar
          </button>
          <button
            className={`${styles.segmentedBtn} ${applyMode === 'add' ? styles.segmentedBtnActiveDark : ''}`}
            onClick={() => setApplyMode('add')}
          >
            Añadir
          </button>
        </div>

        <button
          className={styles.applyBtn}
          disabled={!document || isApplying}
          onClick={handleApply}
        >
          {isApplying ? 'Aplicando…' : 'Aplicar guías'}
        </button>

        <div className={styles.statusMsg}>
          {lastError && <span className={styles.statusError}>{lastError}</span>}
          {lastSuccess && !lastError && <span className={styles.statusSuccess}>✓ Guías aplicadas</span>}
        </div>

      </div>
    </div>
  );
}
