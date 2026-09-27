import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useNavigationStore } from '@/modules/navigation/navigationStore';
import { NewOrderView } from '@/views/NewOrderView';
import { DesignsView } from '@/views/DesignsView';
import { PatternsView } from '@/views/PatternsView';
import { ProductionNestingView } from '@/views/ProductionNestingView';
import { HistoryView } from '@/views/HistoryView';
import { SettingsView } from '@/views/SettingsView';
import { dbService } from '@/core/database/db';

export const App: React.FC = () => {
  const { currentView } = useNavigationStore();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    // Inicializar base de datos SQLite embebida
    dbService.initialize()
      .then(() => setDbReady(true))
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
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
};
