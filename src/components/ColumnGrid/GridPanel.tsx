// src/components/ColumnGrid/GridPanel.tsx
import React, { useEffect } from 'react';
import { useGridStore, useUIStore } from '../../store';
import { useDocument } from '../../hooks/useDocument';
import { NumberInput } from '../shared/NumberInput';
import { photoshopBridge } from '../../services/photoshopBridge';
import { generateGuides, GridGenerationError } from '../../services/gridGenerator';
import styles from './GridPanel.module.css';

// ── SVG icons (inline, minimal) ─────────────────────────────────────────────

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
      <span className={styles.sectionTitle}>
        {icon}
        {title}
      </span>
      <sp-switch
        checked={enabled || undefined}
        onClick={onToggle}
      />
    </div>
  );
}

// ── Apply area ────────────────────────────────────────────────────────────────

function ApplyArea() {
  const config = useGridStore((s) => s.config);
  const { setApplyMode } = useGridStore();
  const { document } = useDocument();
  const { isApplying, lastError, lastSuccess, setApplying, setError, setSuccess } = useUIStore();

  // Clear success after 2 s
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
      const guides = generateGuides(config, { width: document.width, height: document.height });
      await photoshopBridge.applyGuides(guides, config.applyMode);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof GridGenerationError ? err.message : 'Error al aplicar guías');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className={styles.applySection}>
      <div className={styles.modeRow}>
        <button
          className={`${styles.modeBtn} ${config.applyMode === 'replace' ? styles.modeBtnActive : ''}`}
          onClick={() => setApplyMode('replace')}
        >
          Reemplazar
        </button>
        <button
          className={`${styles.modeBtn} ${config.applyMode === 'add' ? styles.modeBtnActive : ''}`}
          onClick={() => setApplyMode('add')}
        >
          Añadir
        </button>
      </div>

      {!document && (
        <p className={styles.notice}>Abre un documento en Photoshop</p>
      )}

      <button
        className={styles.applyBtn}
        disabled={!document || isApplying}
        onClick={handleApply}
        style={{ marginTop: document ? 8 : 4 }}
      >
        {isApplying ? 'Aplicando…' : 'Aplicar guías'}
      </button>

      <div className={styles.status}>
        {lastError && <span className={styles.statusError}>{lastError}</span>}
        {lastSuccess && !lastError && <span className={styles.statusSuccess}>✓ Guías aplicadas</span>}
      </div>
    </div>
  );
}

// ── GridPanel ─────────────────────────────────────────────────────────────────

export function GridPanel() {
  const { config, setColumnConfig, setRowConfig, setMarginsConfig } = useGridStore();
  const { columns, rows, margins } = config;

  return (
    <div className={styles.panel}>

      {/* Margins */}
      <div className={styles.section}>
        <SectionHeader
          icon={<IconMargins />}
          title="Márgenes"
          enabled={margins.enabled}
          onToggle={() => setMarginsConfig({ enabled: !margins.enabled })}
        />
        {margins.enabled && (
          <div className={styles.marginsGrid}>
            <NumberInput compact label="Arriba" value={margins.top} min={0} max={2000} suffix="px"
              onChange={(v) => setMarginsConfig({ top: v })} />
            <NumberInput compact label="Derecha" value={margins.right} min={0} max={2000} suffix="px"
              onChange={(v) => setMarginsConfig({ right: v })} />
            <NumberInput compact label="Abajo" value={margins.bottom} min={0} max={2000} suffix="px"
              onChange={(v) => setMarginsConfig({ bottom: v })} />
            <NumberInput compact label="Izquierda" value={margins.left} min={0} max={2000} suffix="px"
              onChange={(v) => setMarginsConfig({ left: v })} />
          </div>
        )}
      </div>

      {/* Columns */}
      <div className={styles.section}>
        <SectionHeader
          icon={<IconColumns />}
          title="Columnas"
          enabled={columns.enabled}
          onToggle={() => setColumnConfig({ enabled: !columns.enabled })}
        />
        {columns.enabled && (
          <div className={styles.inputRow}>
            <NumberInput compact label="Cantidad" value={columns.columns} min={1} max={24}
              onChange={(v) => setColumnConfig({ columns: v })} />
            <NumberInput compact label="Gutter" value={columns.gutter} min={0} max={500} suffix="px"
              onChange={(v) => setColumnConfig({ gutter: v })} />
            <NumberInput compact label="Margen" value={columns.marginLeft} min={0} max={2000} suffix="px"
              onChange={(v) => setColumnConfig({ marginLeft: v, marginRight: v })} />
          </div>
        )}
      </div>

      {/* Rows */}
      <div className={styles.section}>
        <SectionHeader
          icon={<IconRows />}
          title="Filas"
          enabled={rows.enabled}
          onToggle={() => setRowConfig({ enabled: !rows.enabled })}
        />
        {rows.enabled && (
          <div className={styles.inputRow}>
            <NumberInput compact label="Cantidad" value={rows.rows} min={1} max={100}
              onChange={(v) => setRowConfig({ rows: v })} />
            <NumberInput compact label="Gutter" value={rows.gutter} min={0} max={500} suffix="px"
              onChange={(v) => setRowConfig({ gutter: v })} />
            <NumberInput compact label="Margen" value={rows.marginTop} min={0} max={2000} suffix="px"
              onChange={(v) => setRowConfig({ marginTop: v, marginBottom: v })} />
          </div>
        )}
      </div>

      {/* Apply */}
      <ApplyArea />

    </div>
  );
}
