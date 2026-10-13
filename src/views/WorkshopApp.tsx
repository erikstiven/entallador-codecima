import React, { lazy, Suspense, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useNavigationStore } from '@/modules/navigation/navigationStore';
import { dbService } from '@/core/database/db';
import { useDesignStore } from '@/modules/designs/designStore';
import { usePatternStore } from '@/modules/patterns/patternStore';
import { applyThemeToDocument, useThemeStore } from '@/modules/settings/themeStore';

const NewOrderView = lazy(() =>
  import('@/views/NewOrderView').then((module) => ({ default: module.NewOrderView }))
);
const DesignsView = lazy(() =>
  import('@/views/DesignsView').then((module) => ({ default: module.DesignsView }))
);
const PatternsView = lazy(() =>
  import('@/views/PatternsView').then((module) => ({ default: module.PatternsView }))
);
const ProductionNestingView = lazy(() =>
  import('@/views/ProductionNestingView').then((module) => ({
    default: module.ProductionNestingView,
  }))
);
const HistoryView = lazy(() =>
  import('@/views/HistoryView').then((module) => ({ default: module.HistoryView }))
);
const SettingsView = lazy(() =>
  import('@/views/SettingsView').then((module) => ({ default: module.SettingsView }))
);

const ViewFallback: React.FC = () => (
  <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950 gap-3">
    <img
      src="/cimatex-icon.png"
      alt="CimaTex"
      className="size-10 object-contain animate-pulse"
    />
    <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono">
      <span className="size-3.5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
      <span>Cargando módulo de CimaTex…</span>
    </div>
  </div>
);

export const WorkshopApp: React.FC = () => {
  const currentView = useNavigationStore((state) => state.currentView);
  const isNestingPreviewMode = useNavigationStore(
    (state) => state.isNestingPreviewMode
  );
  const isFocusedNesting = currentView === 'NESTING' && isNestingPreviewMode;

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('landing-active');
      document.body.classList.add('overflow-hidden', 'select-none');
    }
    applyThemeToDocument(useThemeStore.getState().theme);

    // Inicializar base de datos SQLite embebida con persistencia local IndexedDB
    // únicamente cuando se monta el sistema de taller (/app)
    dbService
      .initialize()
      .then(() => {
        useDesignStore.getState().loadDesignsFromDatabase();
        usePatternStore.getState().loadFromDatabase();
      })
      .catch((err) => console.error('Error inicializando SQLite:', err));
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'NEW_ORDER':
        return <NewOrderView />;
      case 'DESIGNS':
        return <DesignsView />;
      case 'PATTERNS':
        return <PatternsView />;
      case 'NESTING':
        return <ProductionNestingView />;
      case 'HISTORY':
        return <HistoryView />;
      case 'SETTINGS':
        return <SettingsView />;
      default:
        return <NewOrderView />;
    }
  };

  return (
    <div
      data-testid="workshop-app-shell"
      className="flex h-screen w-screen overflow-hidden select-none bg-slate-950 text-slate-100"
    >
      {/* Primary Sidebar Navigation */}
      {!isFocusedNesting && <Sidebar />}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {!isFocusedNesting && <Header />}
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<ViewFallback />}>{renderCurrentView()}</Suspense>
        </main>
      </div>
    </div>
  );
};
