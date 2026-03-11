import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { WispProvider } from '@wisp-ui/react';
import { App } from './App';
import { ThemePersistence } from './shared/ThemePersistence';

const STORAGE_KEY = 'wisp-theme-mode';

function getInitialMode(): 'dark' | 'light' {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable
  }
  return 'dark';
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WispProvider mode={getInitialMode()}>
      <ThemePersistence storageKey={STORAGE_KEY} />
      <HashRouter>
        <App />
      </HashRouter>
    </WispProvider>
  </React.StrictMode>,
);
