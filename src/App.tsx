// src/App.tsx
import React from 'react';
import { useUIStore } from './store';
import { GridPanel } from './components/ColumnGrid/GridPanel';
import { useDocument } from './hooks/useDocument';
import { photoshopBridge } from './services/photoshopBridge';
import styles from './App.module.css';

export function App() {
  const { guidesVisible, setGuidesVisible } = useUIStore();
  const { document } = useDocument();

  async function handleToggleEye() {
    const next = !guidesVisible;
    await photoshopBridge.toggleGuidesVisibility(next);
    setGuidesVisible(next);
  }

  return (
    <div className={styles.app}>

      {/* ── Tab bar ── */}
      <div className={styles.tabBar}>
        <span className={styles.tabActive}>Grid</span>
        <div className={styles.tabBarSpacer} />
        <button
          className={styles.eyeBtn}
          onClick={handleToggleEye}
          disabled={!document}
        >
          {guidesVisible ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* ── No-document notice ── */}
      {!document && (
        <div className={styles.noDoc}>Open a document in Photoshop to get started.</div>
      )}

      {/* ── Main panel ── */}
      <div className={styles.tabContent}>
        <GridPanel />
      </div>

    </div>
  );
}
