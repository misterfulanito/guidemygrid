// src/components/ColumnGrid/GridPanel.tsx
import React, { useEffect, useState } from 'react';
import { useGridStore, useUIStore } from '../../store';
import { useDocument } from '../../hooks/useDocument';
import { photoshopBridge } from '../../services/photoshopBridge';
import { generateColumnGuides, generateRowGuides, GridGenerationError } from '../../services/gridGenerator';
import { VERSION } from '../../version';
import styles from './GridPanel.module.css';


// ── Columns icon (SVG in div — renders fine in UXP) ───────────────────────

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

// ── Text input (empty-capable) ────────────────────────────────────────────

interface NumInputProps {
  placeholder: string;
  value: string;
  disabled?: boolean;
  onChange?: (v: string) => void;
}

function NumInput({ placeholder, value, disabled, onChange }: NumInputProps) {
  const [raw, setRaw] = useState(value);

  useEffect(() => { setRaw(value); }, [value]);

  const commit = () => {
    if (!onChange) return;
    const trimmed = raw.trim();
    if (trimmed === '') {
      onChange('');
      return;
    }
    const n = parseFloat(trimmed);
    if (!isNaN(n) && n >= 0) {
      onChange(String(Math.round(n * 100) / 100));
    } else {
      setRaw(value);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      className={`${styles.input} ${disabled ? styles.inputDisabled : ''}`}
      value={disabled ? value : raw}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => !disabled && setRaw(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
    />
  );
}

// ── GridPanel ─────────────────────────────────────────────────────────────

export function GridPanel() {
  const { columns, setColumns, rows, setRows } = useGridStore();
  const { isApplying, lastError, setApplying, setError } = useUIStore();
  const { document, selection } = useDocument();
  const countNum = parseFloat(columns.count);
  const gutterNum = parseFloat(columns.gutter) || 0;
  const hasCount = columns.count !== '' && !isNaN(countNum) && countNum > 0;
  const gutterDisabled = !hasCount;

  // Container from selection or canvas
  const containerWidth = selection ? selection.width : (document?.width ?? 0);
  const containerHeight = selection ? selection.height : (document?.height ?? 0);
  const offsetX = selection ? selection.left : 0;

  const rowCountNum = parseFloat(rows.count);
  const rowGutterNum = parseFloat(rows.gutter) || 0;
  const hasRowCount = rows.count !== '' && !isNaN(rowCountNum) && rowCountNum > 0;
  const rowGutterDisabled = !hasRowCount;
  const offsetY = selection ? selection.top : 0;

  const computedHeightPx = hasRowCount && containerHeight > 0
    ? (containerHeight - (rowCountNum - 1) * rowGutterNum) / rowCountNum
    : NaN;
  const heightDisplay = !isNaN(computedHeightPx) && computedHeightPx > 0
    ? String(Math.round(computedHeightPx * 100) / 100)
    : '';

  // Context bar
  const contextSource = selection ? 'Selection' : 'Canvas';
  const contextDims = document
    ? `${Math.round(containerWidth)} × ${Math.round(containerHeight)} px`
    : '';

  // Width display
  const computedWidthPx = hasCount && containerWidth > 0
    ? (containerWidth - (countNum - 1) * gutterNum) / countNum
    : NaN;
  const widthDisplay = !isNaN(computedWidthPx) && computedWidthPx > 0
    ? String(Math.round(computedWidthPx * 100) / 100)
    : '';

  const addDisabled = (!hasCount && !hasRowCount) || !document || isApplying;

  const handleAdd = async () => {
    if (addDisabled) return;
    setApplying(true);
    setError(null);
    try {
      const vertical = hasCount
        ? generateColumnGuides({ columns: countNum, gutter: gutterNum, containerWidth, offsetX })
        : [];
      const horizontal = hasRowCount
        ? generateRowGuides({ rows: rowCountNum, gutter: rowGutterNum, containerHeight, offsetY })
        : [];
      await photoshopBridge.applyGuides({ vertical, horizontal }, 'replace');
    } catch (err) {
      setError(err instanceof GridGenerationError ? err.message : 'Error applying guides');
    } finally {
      setApplying(false);
    }
  };

  const [removeMsg, setRemoveMsg] = useState<string | null>(null);

  const handleRemove = async () => {
    setError(null);
    setRemoveMsg(null);
    try {
      const cleared = await photoshopBridge.clearAllGuides();
      if (!cleared) {
        setRemoveMsg('Nothing to remove');
        setTimeout(() => setRemoveMsg(null), 2000);
      }
    } catch {
      setError('Error removing guides');
    }
  };

  return (
    <div className={styles.panel}>

      {/* ── Context bar ── */}
      <div className={styles.contextBar}>
        <span className={styles.contextSource}>{contextSource}: </span>
        <span className={styles.contextDims}>{contextDims}</span>
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>

        {/* Columns section */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <IconColumns />
            <span className={styles.sectionLabel}>Columns</span>
          </div>

          <div className={styles.row3}>
            <NumInput
              placeholder="Quantity"
              value={columns.count}
              onChange={(v) => setColumns({ count: v })}
            />
            <NumInput
              placeholder="Width"
              value={widthDisplay}
              disabled={true}
            />
            <NumInput
              placeholder="Gutter"
              value={columns.gutter}
              disabled={gutterDisabled}
              onChange={(v) => setColumns({ gutter: v })}
            />
          </div>
        </div>

        {/* Rows section */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <IconRows />
            <span className={styles.sectionLabel}>rows</span>
          </div>

          <div className={styles.row3}>
            <NumInput
              placeholder="Quantity"
              value={rows.count}
              onChange={(v) => setRows({ count: v })}
            />
            <NumInput
              placeholder="Height"
              value={heightDisplay}
              disabled={true}
            />
            <NumInput
              placeholder="Gutter"
              value={rows.gutter}
              disabled={rowGutterDisabled}
              onChange={(v) => setRows({ gutter: v })}
            />
          </div>
        </div>

      </div>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <div className={styles.footerRow}>
          <button
            className={styles.addBtn}
            disabled={addDisabled}
            onClick={handleAdd}
          >
            {isApplying ? 'Applying\u2026' : '+ Add guides'}
          </button>
          <button
            className={styles.removeBtn}
            onClick={handleRemove}
          >
            Remove
          </button>
        </div>
        {lastError && (
          <div className={styles.errorMsg}>{lastError}</div>
        )}
        {!lastError && removeMsg && (
          <div className={styles.infoMsg}>{removeMsg}</div>
        )}
      </div>

      {/* ── Version bar ── */}
      <div className={styles.versionBar}>
        GuideMyGrid v{VERSION}
      </div>

    </div>
  );
}
