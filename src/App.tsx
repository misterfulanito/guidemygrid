// src/App.tsx
import React, { useState, useEffect } from 'react';
import { useUIStore } from './store';
import { checkForUpdates, UpdateInfo } from './services/updateChecker';
import { UpdateBanner } from './components/shared/UpdateBanner';
import { GridPanel } from './components/ColumnGrid/GridPanel';
import { Presets } from './components/Presets/Presets';
import styles from './App.module.css';

export function App() {
  const { activeTab, setActiveTab } = useUIStore();
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    checkForUpdates().then((info) => {
      if (info?.hasUpdate) setUpdateInfo(info);
    });
  }, []);

  return (
    <div className={styles.app}>
      {updateInfo && !bannerDismissed && (
        <div className={styles.updateBanner}>
          <UpdateBanner info={updateInfo} onDismiss={() => setBannerDismissed(true)} />
        </div>
      )}

      <sp-tabs
        selected={activeTab}
        onChange={(e: React.ChangeEvent<HTMLElement & { selected: string }>) =>
          setActiveTab(e.target.selected as 'grid' | 'presets')
        }
        class={styles.tabs}
      >
        <sp-tab label="Grid" value="grid" />
        <sp-tab label="Saved" value="presets" />

        <sp-tab-panel value="grid" class={styles.tabPanel}>
          <GridPanel />
        </sp-tab-panel>

        <sp-tab-panel value="presets" class={styles.tabPanel}>
          <Presets />
        </sp-tab-panel>
      </sp-tabs>
    </div>
  );
}
