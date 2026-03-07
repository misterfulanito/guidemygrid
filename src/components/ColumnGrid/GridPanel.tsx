// src/components/ColumnGrid/GridPanel.tsx
import React, { useEffect, useState } from 'react';
import { useGridStore, useUIStore } from '../../store';
import { useDocument } from '../../hooks/useDocument';
import { photoshopBridge } from '../../services/photoshopBridge';
import { generateGuides, GridGenerationError } from '../../services/gridGenerator';
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

function IconGrid() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="2" width="5" height="5" rx="0.5"/>
      <rect x="9" y="2" width="5" height="5" rx="0.5"/>
      <rect x="2" y="9" width="5" height="5" rx="0.5"/>
      <rect x="9" y="9" width="5" height="5" rx="0.5"/>
    </svg>
  );
}

function IconChain() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6.5 9.5a3 3 0 0 0 4.24 0l2-2a3 3 0 0 0-4.24-4.24l-1.12 1.12"/>
      <path d="M9.5 6.5a3 3 0 0 0-4.24 0l-2 2a3 3 0 0 0 4.24 4.24l1.12-1.12"/>
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

// ── Number input ──────────────────────────────────────────────────────────────

interface PInputProps {
  placeholder: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function PInput({ placeholder, value, min, max, onChange, disabled }: PInputProps) {
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
    <div className={styles.inputWrap}>
      <span className={styles.inputLabel}>{placeholder}</span>
      <input
        type="number"
        className={`${styles.input} ${disabled ? styles.inputDisabled : ''}`}
        value={raw}
        placeholder={placeholder}
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

// ── GridPanel ─────────────────────────────────────────────────────────────────

export function GridPanel() {
  const {
    config, setColumnConfig, setRowConfig, setMarginsConfig, setApplyMode, resetToDefaults,
    borderGuides, setBorderGuides, linkedMargins, setLinkedMargins,
  } = useGridStore();
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

  // Computed column width: (docWidth - 2*marginLeft - (columns-1)*gutter) / columns
  const docWidth = document?.width ?? 0;
  const docHeight = document?.height ?? 0;
  const computedColWidth = columns.columns > 0
    ? Math.round(((docWidth - margins.left - margins.right - (columns.columns - 1) * columns.gutter) / columns.columns) * 100) / 100
    : 0;

  // Computed row height: (docHeight - marginTop - marginBottom - (rows-1)*gutter) / rows
  const computedRowHeight = rows.rows > 0
    ? Math.round(((docHeight - margins.top - margins.bottom - (rows.rows - 1) * rows.gutter) / rows.rows) * 100) / 100
    : 0;

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

      if (borderGuides) {
        const bw = selection ? selection.width : document.width;
        const bh = selection ? selection.height : document.height;
        const bx = selection ? selection.left : posX;
        const by = selection ? selection.top : posY;
        guides.vertical.push(bx, bx + bw);
        guides.horizontal.push(by, by + bh);
        // De-duplicate and re-sort after adding border guides
        guides.vertical = [...new Set(guides.vertical)].sort((a, b) => a - b);
        guides.horizontal = [...new Set(guides.horizontal)].sort((a, b) => a - b);
      }

      await photoshopBridge.applyGuides(guides, applyMode);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof GridGenerationError ? err.message : 'Error applying guides');
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

      {/* ── Scrollable sections ── */}
      <div className={styles.content}>

        {/* Margins */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <IconMargins />
            <span className={styles.sectionLabel}>Margins</span>
            <div className={styles.sectionHeadIcons}>
              <button
                className={`${styles.sectionIconBtn} ${borderGuides ? styles.sectionIconBtnActive : ''}`}
                title={borderGuides ? 'Border guides: ON' : 'Border guides: OFF'}
                onClick={() => setBorderGuides(!borderGuides)}
              >
                <IconGrid />
              </button>
              <button
                className={`${styles.sectionIconBtn} ${linkedMargins ? styles.sectionIconBtnActive : ''}`}
                title={linkedMargins ? 'Linked margins: ON' : 'Linked margins: OFF'}
                onClick={() => setLinkedMargins(!linkedMargins)}
              >
                <IconChain />
              </button>
            </div>
          </div>
          <div className={styles.grid2x2}>
            <PInput placeholder="Top" value={margins.top} min={0} max={2000}
              onChange={(v) => linkedMargins
                ? setMarginsConfig({ top: v, bottom: v, left: v, right: v })
                : setMarginsConfig({ top: v })} />
            <PInput placeholder="Left" value={margins.left} min={0} max={2000}
              onChange={(v) => linkedMargins
                ? setMarginsConfig({ top: v, bottom: v, left: v, right: v })
                : setMarginsConfig({ left: v })} />
            <PInput placeholder="Bottom" value={margins.bottom} min={0} max={2000}
              onChange={(v) => linkedMargins
                ? setMarginsConfig({ top: v, bottom: v, left: v, right: v })
                : setMarginsConfig({ bottom: v })} />
            <PInput placeholder="Right" value={margins.right} min={0} max={2000}
              onChange={(v) => linkedMargins
                ? setMarginsConfig({ top: v, bottom: v, left: v, right: v })
                : setMarginsConfig({ right: v })} />
          </div>
        </div>

        {/* Columns */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <IconColumns />
            <span className={styles.sectionLabel}>Columns</span>
          </div>
          <div className={styles.row3}>
            <PInput placeholder="Quantity" value={columns.columns} min={1} max={24}
              onChange={(v) => setColumnConfig({ columns: v })} />
            <PInput placeholder="Width" value={computedColWidth} min={0} max={99999}
              onChange={() => {}} disabled={true} />
            <PInput placeholder="Gutter" value={columns.gutter} min={0} max={500}
              onChange={(v) => setColumnConfig({ gutter: v })} />
          </div>
        </div>

        {/* Rows */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <IconRows />
            <span className={styles.sectionLabel}>Rows</span>
          </div>
          <div className={styles.row3}>
            <PInput placeholder="Quantity" value={rows.rows} min={1} max={100}
              onChange={(v) => setRowConfig({ rows: v })} />
            <PInput placeholder="Height" value={computedRowHeight} min={0} max={99999}
              onChange={() => {}} disabled={true} />
            <PInput placeholder="Gutter" value={rows.gutter} min={0} max={500}
              onChange={(v) => setRowConfig({ gutter: v })} />
          </div>
        </div>

        {/* Position */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <IconPosition />
            <span className={styles.sectionLabel}>Position</span>
          </div>
          <div className={styles.row2}>
            <PInput placeholder="Left" value={posX} min={0} max={99999}
              onChange={setPosX} />
            <PInput placeholder="Top" value={posY} min={0} max={99999}
              onChange={setPosY} />
          </div>
        </div>

        {/* Selection indicator */}
        {selection && (
          <div className={styles.selectionNote}>
            Selection: {Math.round(selection.width)} &times; {Math.round(selection.height)} px
          </div>
        )}

      </div>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <div className={styles.footerRow}>
          <button
            className={styles.applyBtn}
            disabled={!document || isApplying}
            onClick={handleApply}
          >
            {isApplying ? 'Applying\u2026' : 'Add guides'}
          </button>
          <div className={styles.footerIcons}>
            <button
              className={`${styles.iconBtn} ${applyMode === 'replace' ? styles.iconBtnActive : ''}`}
              title={applyMode === 'replace' ? 'Mode: Replace existing guides' : 'Mode: Add to existing guides'}
              onClick={() => setApplyMode(applyMode === 'replace' ? 'add' : 'replace')}
            >
              <IconSave />
            </button>
            <button
              className={styles.iconBtn}
              title="Reset to defaults"
              onClick={handleReset}
            >
              <IconReset />
            </button>
          </div>
        </div>

        {(lastError || lastSuccess) && (
          <div className={styles.statusMsg}>
            {lastError && <span className={styles.statusError}>{lastError}</span>}
            {lastSuccess && !lastError && <span className={styles.statusSuccess}>Guides applied</span>}
          </div>
        )}
      </div>

    </div>
  );
}
