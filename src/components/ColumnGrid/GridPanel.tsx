// src/components/ColumnGrid/GridPanel.tsx
import React, { useEffect, useState } from 'react';
import { useGridStore, useUIStore } from '../../store';
import { useDocument } from '../../hooks/useDocument';
import { photoshopBridge } from '../../services/photoshopBridge';
import { generateGuides, GridGenerationError } from '../../services/gridGenerator';
import { VERSION } from '../../version';
import styles from './GridPanel.module.css';

// ── Icons ────────────────────────────────────────────────────────────────────

function IconMargins() {
  return (
    <svg className={styles.sectionIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="4.5" y="4.5" width="7" height="7" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

function IconColumns() {
  return (
    <svg className={styles.sectionIcon} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="2" width="3.5" height="12" rx="0.5"/>
      <rect x="6.25" y="2" width="3.5" height="12" rx="0.5"/>
      <rect x="11.5" y="2" width="3.5" height="12" rx="0.5"/>
    </svg>
  );
}

function IconRows() {
  return (
    <svg className={styles.sectionIcon} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="1" width="12" height="3.5" rx="0.5"/>
      <rect x="2" y="6.25" width="12" height="3.5" rx="0.5"/>
      <rect x="2" y="11.5" width="12" height="3.5" rx="0.5"/>
    </svg>
  );
}

function IconPosition() {
  return (
    <svg className={styles.sectionIcon} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="1.5" width="13" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M1.5 5.5h13M5.5 1.5v13" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

function IconReset() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 8a4.5 4.5 0 1 0 1-2.8"/>
      <path d="M1.5 4.5l2 1.5 1.5-2"/>
    </svg>
  );
}

function IconSave() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="12" height="12" rx="1.5"/>
      <path d="M5 2v4h6V2M5 9v5"/>
    </svg>
  );
}

// ── Placeholder input ─────────────────────────────────────────────────────────

interface PInput {
  placeholder: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

function PInput({ placeholder, value, min, max, onChange }: PInput) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => { setRaw(String(value)); }, [value]);

  const commit = () => {
    const n = parseFloat(raw);
    if (!isNaN(n)) {
      let c = n;
      if (min !== undefined) c = Math.max(min, c);
      if (max !== undefined) c = Math.min(max, c);
      onChange(c);
      setRaw(String(c));
    } else {
      setRaw(String(value));
    }
  };

  return (
    <input
      type="number"
      className={styles.input}
      value={raw}
      placeholder={placeholder}
      min={min}
      max={max}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
    />
  );
}

// ── GridPanel ─────────────────────────────────────────────────────────────────

export function GridPanel() {
  const { config, setColumnConfig, setRowConfig, setMarginsConfig, setApplyMode, resetToDefaults } = useGridStore();
  const { columns, rows, margins, applyMode } = config;
  const { isApplying, lastError, lastSuccess, setApplying, setError, setSuccess } = useUIStore();
  const { setActiveTab } = useUIStore();
  const { document, selection, refresh } = useDocument();

  // Position offset for guide origin
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  // Auto-populate position from active selection
  useEffect(() => {
    if (selection) {
      setPosX(Math.round(selection.left));
      setPosY(Math.round(selection.top));
    }
  }, [selection]);

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
      // All sections active; position offset determines guide origin
      const effectiveConfig = {
        ...config,
        columns: { ...columns, enabled: true },
        rows: { ...rows, enabled: true },
        margins: { ...margins, enabled: true },
      };
      const ctx = { width: document.width, height: document.height, offsetX: posX, offsetY: posY };
      const guides = generateGuides(effectiveConfig, ctx);
      await photoshopBridge.applyGuides(guides, applyMode);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof GridGenerationError ? err.message : 'Error al aplicar guías');
    } finally {
      setApplying(false);
    }
  };

  const handleReset = () => {
    resetToDefaults();
    setPosX(0);
    setPosY(0);
    setError(null);
  };

  return (
    <div className={styles.panel}>

      {/* ── Header strip ── */}
      <div className={styles.header}>
        <span className={styles.headerTitle}>GuideMyGrid</span>
        <div className={styles.headerRight}>
          {selection && (
            <span
              className={styles.selectionDot}
              title={`Selección activa: ${Math.round(selection.width)} × ${Math.round(selection.height)} px`}
            />
          )}
          <span className={styles.version}>v{VERSION}</span>
          <button className={styles.refreshBtn} onClick={refresh} title="Actualizar estado" aria-label="Actualizar">
            <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" width="11" height="11"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 6a4 4 0 1 0 .8-2.4"/>
              <path d="M1 3l1 1.4 1.4-1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── No-document notice ── */}
      {!document && (
        <div className={styles.noDoc}>Abre un documento en Photoshop</div>
      )}

      {/* ── Scrollable sections ── */}
      <div className={styles.content}>

        {/* Márgenes */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <IconMargins />
            <span className={styles.sectionLabel}>Márgenes</span>
          </div>
          <div className={styles.grid2x2}>
            <PInput placeholder="Arriba" value={margins.top} min={0} max={2000}
              onChange={(v) => setMarginsConfig({ top: v })} />
            <PInput placeholder="Izquierda" value={margins.left} min={0} max={2000}
              onChange={(v) => setMarginsConfig({ left: v })} />
            <PInput placeholder="Abajo" value={margins.bottom} min={0} max={2000}
              onChange={(v) => setMarginsConfig({ bottom: v })} />
            <PInput placeholder="Derecha" value={margins.right} min={0} max={2000}
              onChange={(v) => setMarginsConfig({ right: v })} />
          </div>
        </div>

        {/* Columnas */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <IconColumns />
            <span className={styles.sectionLabel}>Columnas</span>
          </div>
          <div className={styles.row3}>
            <PInput placeholder="Cantidad" value={columns.columns} min={1} max={24}
              onChange={(v) => setColumnConfig({ columns: v })} />
            <PInput placeholder="Gutter" value={columns.gutter} min={0} max={500}
              onChange={(v) => setColumnConfig({ gutter: v })} />
            <PInput placeholder="Margen" value={columns.marginLeft} min={0} max={2000}
              onChange={(v) => setColumnConfig({ marginLeft: v, marginRight: v })} />
          </div>
        </div>

        {/* Filas */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <IconRows />
            <span className={styles.sectionLabel}>Filas</span>
          </div>
          <div className={styles.row3}>
            <PInput placeholder="Filas" value={rows.rows} min={1} max={100}
              onChange={(v) => setRowConfig({ rows: v })} />
            <PInput placeholder="Gutter" value={rows.gutter} min={0} max={500}
              onChange={(v) => setRowConfig({ gutter: v })} />
            <PInput placeholder="Margen" value={rows.marginTop} min={0} max={2000}
              onChange={(v) => setRowConfig({ marginTop: v, marginBottom: v })} />
          </div>
        </div>

        {/* Posición */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <IconPosition />
            <span className={styles.sectionLabel}>Posición</span>
          </div>
          <div className={styles.row2}>
            <PInput placeholder="Izquierda" value={posX} min={0} max={99999}
              onChange={setPosX} />
            <PInput placeholder="Arriba" value={posY} min={0} max={99999}
              onChange={setPosY} />
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <div className={styles.footerRow}>
          <button
            className={styles.applyBtn}
            disabled={!document || isApplying}
            onClick={handleApply}
          >
            {isApplying ? 'Aplicando…' : 'Añadir guías'}
          </button>
          <div className={styles.footerIcons}>
            <button
              className={`${styles.iconBtn} ${applyMode === 'replace' ? styles.iconBtnActive : ''}`}
              title={applyMode === 'replace' ? 'Modo: Reemplazar guías existentes' : 'Modo: Añadir a guías existentes'}
              onClick={() => setApplyMode(applyMode === 'replace' ? 'add' : 'replace')}
            >
              <IconSave />
            </button>
            <button
              className={styles.iconBtn}
              title="Restablecer valores por defecto"
              onClick={handleReset}
            >
              <IconReset />
            </button>
          </div>
        </div>

        {(lastError || lastSuccess) && (
          <div className={styles.statusMsg}>
            {lastError && <span className={styles.statusError}>{lastError}</span>}
            {lastSuccess && !lastError && <span className={styles.statusSuccess}>✓ Guías aplicadas</span>}
          </div>
        )}
      </div>

    </div>
  );
}
