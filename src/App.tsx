// src/App.tsx
import React from 'react';
import { useUIStore } from './store';
import { GridPanel } from './components/ColumnGrid/GridPanel';
import { useDocument } from './hooks/useDocument';
import { photoshopBridge } from './services/photoshopBridge';
import styles from './App.module.css';

function IconEye() {
  return (
    <svg className={styles.eyeIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'none' }}>
      <path
        d="M12 12.6009C12.6312 12.6009 13.1429 12.108 13.1429 11.5C13.1429 10.892 12.6312 10.3991 12 10.3991C11.3688 10.3991 10.8571 10.892 10.8571 11.5C10.8571 12.108 11.3688 12.6009 12 12.6009Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <path
        d="M19.936 11.8633C20.0213 11.6281 20.0213 11.3719 19.936 11.1367C19.2925 9.61801 18.194 8.31833 16.7806 7.40346C15.3672 6.48859 13.7029 6 12 6C10.2971 6 8.63281 6.48859 7.21938 7.40346C5.80595 8.31833 4.70746 9.61801 4.06402 11.1367C3.97866 11.3719 3.97866 11.6281 4.06402 11.8633C4.70746 13.382 5.80595 14.6817 7.21938 15.5965C8.63281 16.5114 10.2971 17 12 17C13.7029 17 15.3672 16.5114 16.7806 15.5965C18.194 14.6817 19.2925 13.382 19.936 11.8633Z"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </svg>
  );
}

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
        <div
          className={`${styles.eyeBtn} ${!guidesVisible ? styles.eyeBtnOff : ''} ${!document ? styles.eyeBtnDisabled : ''}`}
          onClick={document ? handleToggleEye : undefined}
          role="button"
          aria-label={guidesVisible ? 'Hide guides' : 'Show guides'}
          title={guidesVisible ? 'Hide guides' : 'Show guides'}
        >
          <IconEye />
        </div>
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
