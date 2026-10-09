import React, { lazy, Suspense, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useNavigationStore } from '@/modules/navigation/navigationStore';
import { dbService } from '@/core/database/db';
import { useDesignStore } from '@/modules/designs/designStore';
import { usePatternStore } from '@/modules/patterns/patternStore';

const NewOrderView = lazy(() => import('@/views/NewOrderView').then((module) => ({ default: module.NewOrderView })));
const DesignsView = lazy(() => import('@/views/DesignsView').then((module) => ({ default: module.DesignsView })));
const PatternsView = lazy(() => import('@/views/PatternsView').then((module) => ({ default: module.PatternsView })));
const ProductionNestingView = lazy(() => import('@/views/ProductionNestingView').then((module) => ({ default: module.ProductionNestingView })));
const HistoryView = lazy(() => import('@/views/HistoryView').then((module) => ({ default: module.HistoryView })));
const SettingsView = lazy(() => import('@/views/SettingsView').then((module) => ({ default: module.SettingsView })));

const ViewFallback: React.FC = () => (
  <div className="h-full w-full flex items-center justify-center bg-slate-950">
    <div className="flex items-center gap-3 text-sm text-slate-400">
      <span className="h-5 w-5 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
      Preparando módulo…
    </div>
  </div>
);

export const App: React.FC = () => {
  const currentView = useNavigationStore((state) => state.currentView);

  useEffect(() => {
    // Inicializar base de datos SQLite embebida con persistencia local IndexedDB
    dbService.initialize()
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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Primary Sidebar Navigation */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<ViewFallback />}>
            {renderCurrentView()}
          </Suspense>
        </main>
      </div>
    </div>
  );
};
