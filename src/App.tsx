import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { UploadData } from './components/UploadData';
import { IndicatorsList } from './components/IndicatorsList';
import { Settings } from './components/Settings';
import { OverviewDashboard } from './components/OverviewDashboard';
import { IndicatorDataset, PREDEFINED_INDICATORS } from './types';

// Configure localforage for our app
localforage.config({
  name: 'SaudeBrasil360',
  storeName: 'datasets'
});

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [datasets, setDatasets] = useState<Record<string, IndicatorDataset>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load saved data when the app starts
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedDatasets = await localforage.getItem<Record<string, IndicatorDataset>>('all_datasets');
        if (savedDatasets) {
          setDatasets(savedDatasets);
        }
      } catch (error) {
        console.error("Erro ao carregar dados salvos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDataUploaded = async (newDatasets: IndicatorDataset[]) => {
    const updated = { ...datasets };
    newDatasets.forEach(ds => {
      if (updated[ds.id]) {
        // Merge data if it's the same indicator
        const existingData = [...updated[ds.id].data];
        ds.data.forEach(newItem => {
          const existingIndex = existingData.findIndex(item => item.id === newItem.id);
          if (existingIndex >= 0) {
            existingData[existingIndex] = newItem; // overwrite existing team
          } else {
            existingData.push(newItem); // add new team
          }
        });
        updated[ds.id] = {
          ...updated[ds.id],
          data: existingData,
          lastUpdated: new Date().toISOString()
        };
      } else {
        updated[ds.id] = ds;
      }
    });
    
    setDatasets(updated);
    
    // Save to local storage
    try {
      await localforage.setItem('all_datasets', updated);
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
    }
    
    if (newDatasets.length === 1) {
      setCurrentTab(`ind_${newDatasets[0].id}`); // Redirect to the uploaded indicator if only one
    } else if (newDatasets.length > 1) {
      setCurrentTab('dashboard'); // Redirect to overview if multiple
    }
  };

  const handleClearData = async () => {
    try {
      await localforage.removeItem('all_datasets');
      setDatasets({});
      setCurrentTab('dashboard');
    } catch (error) {
      console.error("Erro ao limpar dados:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Carregando dados salvos...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (currentTab.startsWith('ind_')) {
      const indId = currentTab.replace('ind_', '');
      const dataset = datasets[indId];
      const indicatorDef = PREDEFINED_INDICATORS.find(i => i.id === indId);
      
      return (
        <div className="space-y-6">
          <Dashboard data={dataset?.data || []} indicatorName={indicatorDef?.name || 'Indicador'} isCvat={indId === 'cvat'} />
          <IndicatorsList data={dataset?.data || []} indicatorName={indicatorDef?.name || 'Indicador'} isCvat={indId === 'cvat'} />
        </div>
      );
    }

    if (currentTab.startsWith('group_')) {
      const groupName = currentTab.replace('group_', '');
      return (
        <OverviewDashboard 
          datasets={datasets} 
          onSelectIndicator={(id) => setCurrentTab(`ind_${id}`)}
          onGoToUpload={() => setCurrentTab('upload')}
          filterGroup={groupName}
        />
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <OverviewDashboard 
            datasets={datasets} 
            onSelectIndicator={(id) => setCurrentTab(`ind_${id}`)}
            onGoToUpload={() => setCurrentTab('upload')}
          />
        );
      case 'upload':
        return <UploadData onDataUploaded={handleDataUploaded} />;
      case 'settings':
        return <Settings onClearData={handleClearData} />;
      default:
        return <div>Página não encontrada</div>;
    }
  };

  const getHeaderTitle = () => {
    if (currentTab.startsWith('ind_')) {
      const indId = currentTab.replace('ind_', '');
      const indicatorDef = PREDEFINED_INDICATORS.find(i => i.id === indId);
      return indicatorDef ? `Monitoramento: ${indicatorDef.name}` : 'Indicador';
    }
    switch (currentTab) {
      case 'dashboard': return 'Visão Geral do Município';
      case 'upload': return 'Importação de Dados SIAPS';
      case 'settings': return 'Configurações do Sistema';
      default: return 'Saúde Brasil 360°';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <Sidebar currentTab={currentTab} onTabChange={setCurrentTab} datasets={datasets} />
      
      <main className="flex-1 overflow-y-auto relative">
        <header className="bg-white px-8 py-5 flex justify-between items-center sticky top-0 z-20 shadow-sm border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
              {getHeaderTitle()}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              {Object.keys(datasets).length} indicadores carregados
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              MS
            </div>
          </div>
        </header>
        
        <div className="p-6 h-[calc(100vh-85px)]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
