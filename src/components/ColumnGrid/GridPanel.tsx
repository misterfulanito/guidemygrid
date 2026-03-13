// src/components/ColumnGrid/GridPanel.tsx
import React, { useEffect, useState } from 'react';
import { useGridStore, useUIStore } from '../../store';
import { useDocument } from '../../hooks/useDocument';
import { photoshopBridge } from '../../services/photoshopBridge';
import { generateColumnGuides, generateRowGuides, generateMarginGuides, GridGenerationError } from '../../services/gridGenerator';
import { VERSION } from '../../version';
import { SideGuidesBar } from '../SideGuidesBar/SideGuidesBar';
import styles from './GridPanel.module.css';


// ── Link icons (16px inside 24px button, two-color fill) ─────────────────

function IconLink() {
  return (
    <svg className={styles.linkIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      <path
        d="M9.6 16H8C6.93913 16 5.92172 15.5786 5.17157 14.8284C4.42143 14.0783 4 13.0609 4 12C4 10.9391 4.42143 9.92172 5.17157 9.17157C5.92172 8.42143 6.93913 8 8 8H9.6M14.4 8H16C17.0609 8 18.0783 8.42143 18.8284 9.17157C19.5786 9.92172 20 10.9391 20 12C20 13.0609 19.5786 14.0783 18.8284 14.8284C18.0783 15.5786 17.0609 16 16 16H14.4M8.8 12H15.2"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </svg>
  );
}

function IconLinkOff() {
  return (
    <svg className={styles.linkIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      <path
        d="M9.6 16H8C6.93913 16 5.92172 15.5786 5.17157 14.8284C4.42143 14.0783 4 13.0609 4 12C4 10.9391 4.42143 9.92172 5.17157 9.17157C5.92172 8.42143 6.93913 8 8 8M14.4 8H16C16.7428 8 17.471 8.20686 18.1029 8.5974C18.7348 8.98794 19.2455 9.54672 19.5777 10.2111C19.9099 10.8756 20.0505 11.6194 19.9838 12.3592C19.9171 13.0991 19.6457 13.8057 19.2 14.4M8.8 12H12M4 4L20 20"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </svg>
  );
}

// ── Action icons (24px, stroke="currentColor") ───────────────────────────

function IconReset() {
  return (
    <svg className={styles.resetIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      <path
        d="M3 12C3 13.78 3.52784 15.5201 4.51677 17.0001C5.50571 18.4802 6.91131 19.6337 8.55585 20.3149C10.2004 20.9961 12.01 21.1743 13.7558 20.8271C15.5016 20.4798 17.1053 19.6226 18.364 18.364C19.6226 17.1053 20.4798 15.5016 20.8271 13.7558C21.1743 12.01 20.9961 10.2004 20.3149 8.55585C19.6337 6.91131 18.4802 5.50571 17.0001 4.51677C15.5201 3.52784 13.78 3 12 3C9.48395 3.00947 7.06897 3.99122 5.26 5.74L3 8M3 8V3M3 8H8"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </svg>
  );
}

// ── Section icons (visual only, 16px, two-color stroke system) ───────────

function IconMargins() {
  return (
    <svg className={styles.sectionIcon} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      {/* Frame: rectangle border */}
      <path className={styles.sectionIconFrame} d="M1.00334 1V15H15.0033V1H1.00334Z" strokeWidth="2" />
      {/* Content: 4 margin guide lines */}
      <path className={styles.sectionIconContent} d="M16 3.33333L0 3.33333M16 12.6667H0M12.6667 16V0M3.33333 16L3.33333 0" strokeWidth="2" />
    </svg>
  );
}

function IconColumns() {
  return (
    <svg className={styles.sectionIcon} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      <path className={styles.sectionIconFrame} d="M1.00334 1V15H15.0033V1H1.00334Z" strokeWidth="2" />
      <path className={styles.sectionIconContent} d="M1.00001 16L1.00001 -3.49691e-07M8.00001 16L8.00001 -1.74846e-07M15 16L15 0" strokeWidth="2" />
    </svg>
  );
}

function IconRows() {
  return (
    <svg className={styles.sectionIcon} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      <path className={styles.sectionIconFrame} d="M1.00334 1V15H15.0033V1H1.00334Z" strokeWidth="2" />
      <path className={styles.sectionIconContent} d="M16 15H0M16 8H0M16 1H0" strokeWidth="2" />
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
  const { columns, setColumns, rows, setRows, margins, setMargins } = useGridStore();
  const { isApplying, lastError, setApplying, setError, marginsLocked, setMarginsLocked } = useUIStore();
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

  const parseMargin = (v: string) => {
    const n = parseFloat(v);
    return v !== '' && !isNaN(n) && n > 0 ? n : undefined;
  };
  const topVal    = parseMargin(margins.top);
  const bottomVal = parseMargin(margins.bottom);
  const leftVal   = parseMargin(margins.left);
  const rightVal  = parseMargin(margins.right);
  const hasAnyMargin = topVal != null || bottomVal != null || leftVal != null || rightVal != null;

  // Margin-adjusted container — only when locked (marginsLocked = true)
  const colOffsetX = marginsLocked ? offsetX + (leftVal ?? 0) : offsetX;
  const colWidth   = marginsLocked ? containerWidth - (leftVal ?? 0) - (rightVal ?? 0) : containerWidth;
  const rowOffsetY = marginsLocked ? offsetY + (topVal ?? 0) : offsetY;
  const rowHeight  = marginsLocked ? containerHeight - (topVal ?? 0) - (bottomVal ?? 0) : containerHeight;

  const computedHeightPx = hasRowCount && rowHeight > 0
    ? (rowHeight - (rowCountNum - 1) * rowGutterNum) / rowCountNum
    : NaN;
  const heightDisplay = !isNaN(computedHeightPx) && computedHeightPx > 0
    ? String(Math.round(computedHeightPx * 100) / 100)
    : '';

  // Context bar
  const contextSource = selection ? 'Selection' : 'Canvas';
  const contextDims = document
    ? `${Math.round(containerWidth)} × ${Math.round(containerHeight)} px`
    : '';

  // Width display (uses margin-adjusted width)
  const computedWidthPx = hasCount && colWidth > 0
    ? (colWidth - (countNum - 1) * gutterNum) / countNum
    : NaN;
  const widthDisplay = !isNaN(computedWidthPx) && computedWidthPx > 0
    ? String(Math.round(computedWidthPx * 100) / 100)
    : '';

  const addDisabled = (!hasCount && !hasRowCount && !hasAnyMargin) || !document || isApplying;

  const handleAdd = async () => {
    if (addDisabled) return;
    setApplying(true);
    setError(null);
    try {
      const colVertical = hasCount
        ? generateColumnGuides({ columns: countNum, gutter: gutterNum, containerWidth: colWidth, offsetX: colOffsetX })
        : [];
      const rowHorizontal = hasRowCount
        ? generateRowGuides({ rows: rowCountNum, gutter: rowGutterNum, containerHeight: rowHeight, offsetY: rowOffsetY })
        : [];
      const marginGuides = hasAnyMargin
        ? generateMarginGuides({
            top: topVal, bottom: bottomVal, left: leftVal, right: rightVal,
            containerWidth, containerHeight, offsetX, offsetY,
          })
        : { vertical: [], horizontal: [] };

      const vertical   = [...new Set([...marginGuides.vertical,   ...colVertical])].sort((a, b) => a - b);
      const horizontal = [...new Set([...marginGuides.horizontal, ...rowHorizontal])].sort((a, b) => a - b);

      await photoshopBridge.applyGuides({ vertical, horizontal }, 'replace');
    } catch (err) {
      setError(err instanceof GridGenerationError ? err.message : 'Error applying guides');
    } finally {
      setApplying(false);
    }
  };

  const [marginsLinked, setMarginsLinked] = useState(false);

  const handleMarginChange = (field: 'top' | 'bottom' | 'left' | 'right', v: string) => {
    if (marginsLinked && v !== '') {
      setMargins({ top: v, bottom: v, left: v, right: v });
    } else {
      setMargins({ [field]: v });
    }
  };

  const handleClear = async () => {
    try {
      await photoshopBridge.clearAllGuides();
    } catch {
      setError('Error clearing guides');
    }
  };

  const handleReset = () => {
    setColumns({ count: '', gutter: '' });
    setRows({ count: '', gutter: '' });
    setMargins({ top: '', bottom: '', left: '', right: '' });
    setMarginsLocked(true);
    setMarginsLinked(false);
    setError(null);
  };

  return (
    <div className={styles.panel}>

      {/* ── Context bar ── */}
      <div className={styles.contextBar}>
        <span className={styles.contextSource}>{contextSource}: </span>
        <span className={styles.contextDims}>{contextDims}</span>
      </div>

      {/* ── Side Guides Bar ── */}
      <SideGuidesBar
        containerWidth={containerWidth}
        containerHeight={containerHeight}
        offsetX={offsetX}
        offsetY={offsetY}
        disabled={!document}
      />

      {/* ── Content ── */}
      <div className={styles.content}>

        {/* Margins section */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <IconMargins />
            <span className={styles.sectionLabel}>Margins</span>
            <div className={styles.marginControls}>
              <div
                className={styles.linkBtn}
                onClick={() => setMarginsLinked(!marginsLinked)}
                role="button"
                aria-label={marginsLinked ? 'Unlink margin fields' : 'Link all margin fields'}
                title={marginsLinked ? 'Unlink margin fields' : 'Link all margin fields'}
              >
                {marginsLinked ? <IconLink /> : <IconLinkOff />}
              </div>
            </div>
          </div>

          <div className={styles.row2}>
            <NumInput
              placeholder="Left"
              value={margins.left}
              onChange={(v) => handleMarginChange('left', v)}
            />
            <NumInput
              placeholder="Right"
              value={margins.right}
              onChange={(v) => handleMarginChange('right', v)}
            />
          </div>
          <div className={styles.row2}>
            <NumInput
              placeholder="Top"
              value={margins.top}
              onChange={(v) => handleMarginChange('top', v)}
            />
            <NumInput
              placeholder="Bottom"
              value={margins.bottom}
              onChange={(v) => handleMarginChange('bottom', v)}
            />
          </div>

          <div className={styles.marginUsage}>
            <input
              type="checkbox"
              id="marginsLocked"
              checked={marginsLocked}
              onChange={(e) => setMarginsLocked((e.target as HTMLInputElement).checked)}
              title="When checked, columns and rows are placed within margin bounds. When unchecked, they use the full canvas or selection."
            />
            <label
              htmlFor="marginsLocked"
              className={styles.marginUsageLabel}
              title="When checked, columns and rows are placed within margin bounds. When unchecked, they use the full canvas or selection."
            >
              Use Margin Bounds
            </label>
          </div>
        </div>

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
            <span className={styles.sectionLabel}>Rows</span>
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
          <div
            className={`${styles.addBtn} ${addDisabled ? styles.addBtnDisabled : ''}`}
            onClick={!addDisabled ? handleAdd : undefined}
            role="button"
            aria-disabled={addDisabled}
            title="Apply column, row, and margin guides"
          >
            {isApplying ? 'Applying\u2026' : 'Add guides'}
          </div>
          <div className={styles.footerActions}>
            <div
              className={styles.clearBtn}
              onClick={handleClear}
              role="button"
              aria-label="Clear all guides"
              title="Remove all guides from the document"
            >
              Clear Guides
            </div>
            <div
              className={styles.resetBtn}
              onClick={handleReset}
              role="button"
              aria-label="Reset all fields to default"
              title="Reset all fields to their default values"
            >
              <IconReset />
            </div>
          </div>
        </div>
        {lastError && (
          <div className={styles.errorMsg}>{lastError}</div>
        )}
      </div>

      {/* ── Version bar ── */}
      <div className={styles.versionBar}>
        GuideMyGrid v{VERSION}
      </div>

    </div>
  );
}
