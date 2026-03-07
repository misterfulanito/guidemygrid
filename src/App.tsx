// src/App.tsx
import React, { useState, useEffect } from 'react';
import { useUIStore } from './store';
import { checkForUpdates, UpdateInfo } from './services/updateChecker';
import { UpdateBanner } from './components/shared/UpdateBanner';
import { GridPanel } from './components/ColumnGrid/GridPanel';
import { Presets } from './components/Presets/Presets';
import { useDocument } from './hooks/useDocument';
import { photoshopBridge } from './services/photoshopBridge';
import { VERSION } from './version';
import styles from './App.module.css';

// ── Toolbar icons ─────────────────────────────────────────────────────────────

function IconAlignLeft() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
      <rect x="2" y="2" width="10" height="2.5" rx="0.5" fill="currentColor"/>
      <rect x="2" y="5.75" width="6" height="2.5" rx="0.5" fill="currentColor"/>
      <rect x="2" y="9.5" width="8" height="2.5" rx="0.5" fill="currentColor"/>
      <rect x="1" y="1" width="1" height="12" rx="0.5" fill="currentColor"/>
    </svg>
  );
}

function IconAlignCenterH() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
      <rect x="2" y="2" width="10" height="2.5" rx="0.5" fill="currentColor"/>
      <rect x="4" y="5.75" width="6" height="2.5" rx="0.5" fill="currentColor"/>
      <rect x="3" y="9.5" width="8" height="2.5" rx="0.5" fill="currentColor"/>
      <rect x="6.5" y="1" width="1" height="12" rx="0.5" fill="currentColor"/>
    </svg>
  );
}

function IconAlignRight() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
      <rect x="2" y="2" width="10" height="2.5" rx="0.5" fill="currentColor"/>
      <rect x="6" y="5.75" width="6" height="2.5" rx="0.5" fill="currentColor"/>
      <rect x="4" y="9.5" width="8" height="2.5" rx="0.5" fill="currentColor"/>
      <rect x="12" y="1" width="1" height="12" rx="0.5" fill="currentColor"/>
    </svg>
  );
}

function IconClearAll() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
      stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <line x1="2" y1="2" x2="12" y2="12"/>
      <line x1="12" y1="2" x2="2" y2="12"/>
      <rect x="1" y="1" width="12" height="12" rx="1.5" strokeWidth="1.2"/>
    </svg>
  );
}

function IconAlignTop() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
      <rect x="2" y="2" width="2.5" height="10" rx="0.5" fill="currentColor"/>
      <rect x="5.75" y="2" width="2.5" height="6" rx="0.5" fill="currentColor"/>
      <rect x="9.5" y="2" width="2.5" height="8" rx="0.5" fill="currentColor"/>
      <rect x="1" y="1" width="12" height="1" rx="0.5" fill="currentColor"/>
    </svg>
  );
}

function IconAlignCenterV() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
      <rect x="2" y="2" width="2.5" height="10" rx="0.5" fill="currentColor"/>
      <rect x="5.75" y="4" width="2.5" height="6" rx="0.5" fill="currentColor"/>
      <rect x="9.5" y="3" width="2.5" height="8" rx="0.5" fill="currentColor"/>
      <rect x="1" y="6.5" width="12" height="1" rx="0.5" fill="currentColor"/>
    </svg>
  );
}

function IconAlignBottom() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14">
      <rect x="2" y="2" width="2.5" height="10" rx="0.5" fill="currentColor"/>
      <rect x="5.75" y="6" width="2.5" height="6" rx="0.5" fill="currentColor"/>
      <rect x="9.5" y="4" width="2.5" height="8" rx="0.5" fill="currentColor"/>
      <rect x="1" y="12" width="12" height="1" rx="0.5" fill="currentColor"/>
    </svg>
  );
}

function IconEye() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
      stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z"/>
      <circle cx="7" cy="7" r="1.5"/>
    </svg>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export function App() {
  const { activeTab, setActiveTab, guidesVisible, setGuidesVisible, documentGuideCount, setDocumentGuideCount } = useUIStore();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const { document, selection, refresh } = useDocument();

  // Sync guide count whenever the document changes
  useEffect(() => {
    if (!document) {
      setDocumentGuideCount(0);
      return;
    }
    photoshopBridge.getAllGuides().then((guides) => {
      setDocumentGuideCount(guides.length);
    }).catch(() => setDocumentGuideCount(0));
  }, [document, setDocumentGuideCount]);

  useEffect(() => {
    checkForUpdates().then((info) => {
      if (info?.hasUpdate) setUpdateInfo(info);
    });
  }, []);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2000);
  }

  // Resolve reference bounds: use selection if active, otherwise document dimensions
  function getRefBounds() {
    if (selection) {
      return {
        left: selection.left,
        right: selection.right,
        top: selection.top,
        bottom: selection.bottom,
        width: selection.width,
        height: selection.height,
      };
    }
    if (document) {
      return {
        left: 0,
        right: document.width,
        top: 0,
        bottom: document.height,
        width: document.width,
        height: document.height,
      };
    }
    return null;
  }

  async function handleAlignLeft() {
    const ref = getRefBounds();
    if (!ref) return;
    await photoshopBridge.addAlignmentGuide('vertical', ref.left, 'Align Guide Left');
    setDocumentGuideCount(documentGuideCount + 1);
  }

  async function handleAlignCenterH() {
    const ref = getRefBounds();
    if (!ref) return;
    await photoshopBridge.addAlignmentGuide('vertical', ref.left + ref.width / 2, 'Align Guide Center (H)');
    setDocumentGuideCount(documentGuideCount + 1);
  }

  async function handleAlignRight() {
    const ref = getRefBounds();
    if (!ref) return;
    await photoshopBridge.addAlignmentGuide('vertical', ref.right, 'Align Guide Right');
    setDocumentGuideCount(documentGuideCount + 1);
  }

  async function handleAlignTop() {
    const ref = getRefBounds();
    if (!ref) return;
    await photoshopBridge.addAlignmentGuide('horizontal', ref.top, 'Align Guide Top');
    setDocumentGuideCount(documentGuideCount + 1);
  }

  async function handleAlignCenterV() {
    const ref = getRefBounds();
    if (!ref) return;
    await photoshopBridge.addAlignmentGuide('horizontal', ref.top + ref.height / 2, 'Align Guide Center (V)');
    setDocumentGuideCount(documentGuideCount + 1);
  }

  async function handleAlignBottom() {
    const ref = getRefBounds();
    if (!ref) return;
    await photoshopBridge.addAlignmentGuide('horizontal', ref.bottom, 'Align Guide Bottom');
    setDocumentGuideCount(documentGuideCount + 1);
  }

  async function handleClearAll() {
    if (documentGuideCount === 0) return;
    const count = documentGuideCount;
    await photoshopBridge.clearAllGuides();
    setDocumentGuideCount(0);
    showToast(`${count} guide${count !== 1 ? 's' : ''} deleted`);
  }

  async function handleToggleEye() {
    const next = !guidesVisible;
    await photoshopBridge.toggleGuidesVisibility(next);
    setGuidesVisible(next);
  }

  const toolbarDisabled = !document;
  const clearDisabled = toolbarDisabled || documentGuideCount === 0;

  return (
    <div className={styles.app}>
      {updateInfo && !bannerDismissed && (
        <div className={styles.updateBanner}>
          <UpdateBanner info={updateInfo} onDismiss={() => setBannerDismissed(true)} />
        </div>
      )}

      {/* ── Toast ── */}
      {toastMsg && (
        <div className={styles.toast}>{toastMsg}</div>
      )}

      {/* ── Alignment toolbar ── */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <button
            className={styles.toolBtn}
            title="Align guides left"
            onClick={handleAlignLeft}
            disabled={toolbarDisabled}
          >
            <IconAlignLeft />
          </button>
          <button
            className={styles.toolBtn}
            title="Align guides center (horizontal)"
            onClick={handleAlignCenterH}
            disabled={toolbarDisabled}
          >
            <IconAlignCenterH />
          </button>
          <button
            className={styles.toolBtn}
            title="Align guides right"
            onClick={handleAlignRight}
            disabled={toolbarDisabled}
          >
            <IconAlignRight />
          </button>
        </div>
        <div className={styles.toolbarDivider} />
        <button
          className={styles.toolBtn}
          title="Clear all guides"
          onClick={handleClearAll}
          disabled={clearDisabled}
        >
          <IconClearAll />
        </button>
        <div className={styles.toolbarDivider} />
        <div className={styles.toolbarGroup}>
          <button
            className={styles.toolBtn}
            title="Align guides top"
            onClick={handleAlignTop}
            disabled={toolbarDisabled}
          >
            <IconAlignTop />
          </button>
          <button
            className={styles.toolBtn}
            title="Align guides center (vertical)"
            onClick={handleAlignCenterV}
            disabled={toolbarDisabled}
          >
            <IconAlignCenterV />
          </button>
          <button
            className={styles.toolBtn}
            title="Align guides bottom"
            onClick={handleAlignBottom}
            disabled={toolbarDisabled}
          >
            <IconAlignBottom />
          </button>
        </div>
        <div className={styles.toolbarSpacer} />
        <button
          className={styles.toolBtn}
          title={`Refresh — GuideMyGrid v${VERSION}`}
          onClick={refresh}
        >
          <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" width="14" height="14"
            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <path d="M2.5 7a4.5 4.5 0 1 0 .9-2.7"/>
            <path d="M1.5 3.5l1.5 1.5 1.5-1.5"/>
          </svg>
        </button>
      </div>

      {/* ── Tab bar ── */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'grid' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('grid')}
        >
          Grid
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'custom' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          Custom
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'presets' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          Saved
        </button>
        <div className={styles.tabBarSpacer} />
        <button className={styles.eyeBtn} title="Toggle guides visibility" onClick={handleToggleEye}>
          <IconEye />
        </button>
      </div>

      {/* ── No-document notice ── */}
      {!document && (
        <div className={styles.noDoc}>Open a document in Photoshop to get started.</div>
      )}

      {/* ── Tab panels ── */}
      <div className={styles.tabContent}>
        {activeTab === 'grid' && <GridPanel />}
        {activeTab === 'custom' && (
          <div className={styles.placeholder}>
            <span>Custom — Coming soon</span>
          </div>
        )}
        {activeTab === 'presets' && <Presets />}
      </div>
    </div>
  );
}
