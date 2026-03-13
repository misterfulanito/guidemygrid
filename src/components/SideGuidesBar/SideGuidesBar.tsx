// src/components/SideGuidesBar/SideGuidesBar.tsx
import React, { useState } from 'react';
import { generateSideGuide, SideGuideType } from '../../services/gridGenerator';
import { photoshopBridge } from '../../services/photoshopBridge';
import styles from './SideGuidesBar.module.css';

interface SideGuidesBarProps {
  containerWidth: number;
  containerHeight: number;
  offsetX: number;
  offsetY: number;
  disabled?: boolean;
}

// ── Icons ─────────────────────────────────────────────────────────────────

const iconProps = {
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  style: { pointerEvents: 'none' as const },
};

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function IconLeft() {
  return (
    <svg className={`${styles.btnIcon} ${styles.btnIconLeft}`} viewBox="0 0 25 24" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      {/* Layer 1: 3-sided frame (top, right, bottom) */}
      <path className={styles.iconFrame}
        d="M25 0H27V-2H25V0ZM25 24V26H27V24H25ZM1 0V2H25V0V-2H1V0ZM25 0H23V24H25H27V0H25ZM25 24V22H1V24V26H25V24Z"
        mask="url(#iconLeftMask)"
      />
      <mask id="iconLeftMask">
        <path d="M1 0H25V24H1V0Z" fill="white" />
      </mask>
      {/* Layer 2: left bar (guide indicator) + arrow */}
      <path className={styles.iconContent}
        d="M8.88394 9.72954C9.28685 9.35181 9.30727 8.71897 8.92954 8.31606C8.55181 7.91315 7.91897 7.89273 7.51606 8.27046L8.2 9L8.88394 9.72954ZM5 12L4.31606 11.2705C4.11441 11.4595 4 11.7236 4 12C4 12.2764 4.11441 12.5405 4.31606 12.7295L5 12ZM7.51606 15.7295C7.91897 16.1073 8.55181 16.0869 8.92954 15.6839C9.30727 15.281 9.28685 14.6482 8.88394 14.2705L8.2 15L7.51606 15.7295ZM11 13C11.5523 13 12 12.5523 12 12C12 11.4477 11.5523 11 11 11V12V13ZM1 0H0V24H1H2V0H1ZM8.2 9L7.51606 8.27046L4.31606 11.2705L5 12L5.68394 12.7295L8.88394 9.72954L8.2 9ZM5 12L4.31606 12.7295L7.51606 15.7295L8.2 15L8.88394 14.2705L5.68394 11.2705L5 12ZM5 12V13H11V12V11H5V12Z"
      />
    </svg>
  );
}

function IconRight() {
  return (
    <svg className={`${styles.btnIcon} ${styles.btnIconRight}`} viewBox="0 0 25 24" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      <mask id="iconRightMask">
        <path d="M24 0H0V24H24V0Z" fill="white" />
      </mask>
      {/* Layer 1: 3-sided frame (top, left, bottom) */}
      <path className={styles.iconFrame}
        d="M0 0H-2V-2H0V0ZM0 24V26H-2V24H0ZM24 0V2H0V0V-2H24V0ZM0 0H2V24H0H-2V0H0ZM0 24V22H24V24V26H0V24Z"
        mask="url(#iconRightMask)"
      />
      {/* Layer 2: right bar + arrow pointing right */}
      <path className={styles.iconContent}
        d="M16.1161 9.72954C15.7131 9.35181 15.6927 8.71897 16.0705 8.31606C16.4482 7.91315 17.081 7.89273 17.4839 8.27046L16.8 9L16.1161 9.72954ZM20 12L20.6839 11.2705C20.8856 11.4595 21 11.7236 21 12C21 12.2764 20.8856 12.5405 20.6839 12.7295L20 12ZM17.4839 15.7295C17.081 16.1073 16.4482 16.0869 16.0705 15.6839C15.6927 15.281 15.7131 14.6482 16.1161 14.2705L16.8 15L17.4839 15.7295ZM14 13C13.4477 13 13 12.5523 13 12C13 11.4477 13.4477 11 14 11V12V13ZM24 0H25V24H24H23V0H24ZM16.8 9L17.4839 8.27046L20.6839 11.2705L20 12L19.3161 12.7295L16.1161 9.72954L16.8 9ZM20 12L20.6839 12.7295L17.4839 15.7295L16.8 15L16.1161 14.2705L19.3161 11.2705L20 12ZM20 12V13H14V12V11H20V12Z"
      />
    </svg>
  );
}

function IconTop() {
  return (
    <svg className={`${styles.btnIcon} ${styles.btnIconUp}`} viewBox="0 0 24 25" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      <mask id="iconTopMask">
        <path d="M1.04907e-06 1L0 25L24 25L24 1L1.04907e-06 1Z" fill="white" />
      </mask>
      {/* Layer 1: 3-sided frame (left, right, bottom) */}
      <path className={styles.iconFrame}
        d="M0 25L-8.74228e-08 27L-2 27L-2 25L0 25ZM24 25L26 25L26 27L24 27L24 25ZM1.04907e-06 1L2 1L2 25L0 25L-2 25L-2 1L1.04907e-06 1ZM0 25L8.74228e-08 23L24 23L24 25L24 27L-8.74228e-08 27L0 25ZM24 25L22 25L22 1L24 1L26 1L26 25L24 25Z"
        mask="url(#iconTopMask)"
      />
      {/* Layer 2: top bar + arrow pointing up */}
      <path className={styles.iconContent}
        d="M9.72954 8.88394C9.35181 9.28685 8.71897 9.30727 8.31606 8.92954C7.91315 8.55181 7.89273 7.91897 8.27046 7.51606L9 8.2L9.72954 8.88394ZM12 5L11.2705 4.31606C11.4595 4.11441 11.7236 4 12 4C12.2764 4 12.5405 4.11441 12.7295 4.31606L12 5ZM15.7295 7.51606C16.1073 7.91897 16.0869 8.55181 15.6839 8.92954C15.281 9.30727 14.6482 9.28685 14.2705 8.88394L15 8.2L15.7295 7.51606ZM13 11C13 11.5523 12.5523 12 12 12C11.4477 12 11 11.5523 11 11L12 11L13 11ZM1.04907e-06 1L1.09278e-06 0L24 1.04907e-06L24 1L24 2L1.00536e-06 2L1.04907e-06 1ZM9 8.2L8.27046 7.51606L11.2705 4.31606L12 5L12.7295 5.68394L9.72954 8.88394L9 8.2ZM12 5L12.7295 4.31606L15.7295 7.51606L15 8.2L14.2705 8.88394L11.2705 5.68394L12 5ZM12 5L13 5L13 11L12 11L11 11L11 5L12 5Z"
      />
    </svg>
  );
}

function IconBottom() {
  return (
    <svg className={`${styles.btnIcon} ${styles.btnIconDown}`} viewBox="0 0 24 25" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      <mask id="iconDownMask">
        <path d="M1.04907e-06 24L0 1.04907e-06L24 0L24 24L1.04907e-06 24Z" fill="white" />
      </mask>
      {/* Layer 1: 3-sided frame (left, top, right) */}
      <path className={styles.iconFrame}
        d="M0 1.04907e-06L-8.74228e-08 -2L-2 -2L-2 1.1365e-06L0 1.04907e-06ZM24 0L26 -8.74228e-08L26 -2L24 -2L24 0ZM1.04907e-06 24L2 24L2 9.61651e-07L0 1.04907e-06L-2 1.1365e-06L-2 24L1.04907e-06 24ZM0 1.04907e-06L8.74228e-08 2L24 2L24 0L24 -2L-8.74228e-08 -2L0 1.04907e-06ZM24 0L22 8.74228e-08L22 24L24 24L26 24L26 -8.74228e-08L24 0Z"
        mask="url(#iconDownMask)"
      />
      {/* Layer 2: bottom bar + arrow pointing down */}
      <path className={styles.iconContent}
        d="M9.72954 16.1161C9.35181 15.7131 8.71897 15.6927 8.31606 16.0705C7.91315 16.4482 7.89273 17.081 8.27046 17.4839L9 16.8L9.72954 16.1161ZM12 20L11.2705 20.6839C11.4595 20.8856 11.7236 21 12 21C12.2764 21 12.5405 20.8856 12.7295 20.6839L12 20ZM15.7295 17.4839C16.1073 17.081 16.0869 16.4482 15.6839 16.0705C15.281 15.6927 14.6482 15.7131 14.2705 16.1161L15 16.8L15.7295 17.4839ZM13 14C13 13.4477 12.5523 13 12 13C11.4477 13 11 13.4477 11 14L12 14L13 14ZM1.04907e-06 24L1.09278e-06 25L24 25L24 24L24 23L1.00536e-06 23L1.04907e-06 24ZM9 16.8L8.27046 17.4839L11.2705 20.6839L12 20L12.7295 19.3161L9.72954 16.1161L9 16.8ZM12 20L12.7295 20.6839L15.7295 17.4839L15 16.8L14.2705 16.1161L11.2705 19.3161L12 20ZM12 20L13 20L13 14L12 14L11 14L11 20L12 20Z"
      />
    </svg>
  );
}

function IconCenterV() {
  return (
    <svg className={`${styles.btnIcon} ${styles.btnIconCenter}`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      {/* Layer 1: rectangle frame */}
      <path className={styles.iconFrameStroke} d="M1 1V23H23V1H1Z" strokeWidth="2" />
      {/* Layer 2: vertical guide line */}
      <path className={styles.iconContentStroke} d="M12 0V24" strokeWidth="2" />
    </svg>
  );
}

function IconCenterH() {
  return (
    <svg className={`${styles.btnIcon} ${styles.btnIconCenter}`} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      {/* Layer 1: rectangle frame */}
      <path className={styles.iconFrameStroke} d="M1.005 1V23H23.005V1H1.005Z" strokeWidth="2" />
      {/* Layer 2: horizontal guide line */}
      <path className={styles.iconContentStroke} d="M24 12.005L0 12.005" strokeWidth="2" />
    </svg>
  );
}

// ── Divider ────────────────────────────────────────────────────────────────

function Divider() {
  return (
    <svg viewBox="0 0 1 17" width="1" height="17" fill="none"
      xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none', flexShrink: 0 }}>
      <path d="M0.5 0.5V16.5" stroke="#2D2D2D" strokeLinecap="round" />
    </svg>
  );
}

// ── Bar items (order matches Pencil design) ────────────────────────────────

type BarItem =
  | { kind: 'button'; type: SideGuideType; Icon: () => React.ReactElement; label: string }
  | { kind: 'divider' };

const BAR_ITEMS: BarItem[] = [
  { kind: 'button', type: 'left',     Icon: IconLeft,    label: 'Add left guide' },
  { kind: 'button', type: 'right',    Icon: IconRight,   label: 'Add right guide' },
  { kind: 'button', type: 'top',      Icon: IconTop,     label: 'Add top guide' },
  { kind: 'button', type: 'bottom',   Icon: IconBottom,  label: 'Add bottom guide' },
  { kind: 'divider' },
  { kind: 'button', type: 'center-h', Icon: IconCenterH, label: 'Add horizontal center guide' },
  { kind: 'button', type: 'center-v', Icon: IconCenterV, label: 'Add vertical center guide' },
];

// ── Component ──────────────────────────────────────────────────────────────

export function SideGuidesBar({ containerWidth, containerHeight, offsetX, offsetY, disabled }: SideGuidesBarProps) {
  const [loading, setLoading] = useState<SideGuideType | null>(null);

  const handleClick = async (type: SideGuideType) => {
    if (disabled || loading !== null) return;
    setLoading(type);
    try {
      const { position, orientation } = generateSideGuide(type, {
        containerWidth, containerHeight, offsetX, offsetY,
      });
      await photoshopBridge.addGuide(position, orientation);
    } catch (err) {
      console.error(`[GMG] guide-${type} failed:`, err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={styles.bar}>
      {BAR_ITEMS.map((item, i) => {
        if (item.kind === 'divider') {
          return <Divider key={`divider-${i}`} />;
        }
        const { type, Icon, label } = item;
        const isLoading = loading === type;
        const isDisabled = disabled || loading !== null;
        return (
          <div
            key={type}
            className={`${styles.btn} ${isLoading ? styles.btnLoading : ''} ${isDisabled ? styles.btnDisabled : ''}`}
            onClick={!isDisabled ? () => handleClick(type) : undefined}
            role="button"
            aria-label={label}
            title={label}
          >
            <Icon />
          </div>
        );
      })}
    </div>
  );
}
