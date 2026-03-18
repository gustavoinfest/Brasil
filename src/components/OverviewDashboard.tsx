import React from 'react';
import { IndicatorDataset, PREDEFINED_INDICATORS } from '../types';
import { Activity, CheckCircle, AlertTriangle, XCircle, ChevronRight, UploadCloud } from 'lucide-react';

interface OverviewDashboardProps {
  datasets: Record<string, IndicatorDataset>;
  onSelectIndicator: (id: string) => void;
  onGoToUpload: () => void;
}

export function OverviewDashboard({ datasets, onSelectIndicator, onGoToUpload }: OverviewDashboardProps) {
  // Group indicators by their group
  const groupedIndicators = PREDEFINED_INDICATORS.reduce((acc, indicator) => {
    if (!acc[indicator.group]) {
      acc[indicator.group] = [];
    }
    acc[indicator.group].push(indicator);
    return acc;
  }, {} as Record<string, typeof PREDEFINED_INDICATORS>);

  const getIndicatorStats = (id: string) => {
    const dataset = datasets[id];
    if (!dataset || !dataset.data || dataset.data.length === 0) return null;

    const data = dataset.data;
    const totalEquipes = data.length;
    const isCvat = id === 'cvat';
    
    const mediaPontuacao = data.reduce((acc, curr) => acc + curr.pontuacao, 0) / totalEquipes;
    
    let status: 'success' | 'warning' | 'danger' = 'danger';
    if (isCvat) {
      if (mediaPontuacao >= 7) status = 'success';
      else if (mediaPontuacao >= 4) status = 'warning';
    } else {
      if (mediaPontuacao >= 60) status = 'success';
      else if (mediaPontuacao >= 40) status = 'warning';
    }

    const successCount = data.filter(d => d.status === 'success').length;
    const warningCount = data.filter(d => d.status === 'warning').length;
    const dangerCount = data.filter(d => d.status === 'danger').length;

    return {
      mediaPontuacao,
      status,
      totalEquipes,
      successCount,
      warningCount,
      dangerCount,
      isCvat
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      case 'warning': return 'text-amber-500 bg-amber-50 border-amber-200';
      case 'danger': return 'text-red-500 bg-red-50 border-red-200';
      default: return 'text-slate-400 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={24} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={24} className="text-amber-500" />;
      case 'danger': return <XCircle size={24} className="text-red-500" />;
      default: return <Activity size={24} className="text-slate-400" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Visão Geral dos Indicadores</h2>
          <p className="text-slate-500 text-sm mt-1">Acompanhamento consolidado do município</p>
        </div>
        <button 
          onClick={onGoToUpload}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          <UploadCloud size={18} />
          Importar Dados
        </button>
      </div>

      {Object.entries(groupedIndicators).map(([group, indicators]) => (
        <div key={group} className="mb-10">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-200 pb-2">{group}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {indicators.map((indicator) => {
              const stats = getIndicatorStats(indicator.id);
              
              if (!stats) {
                return (
                  <div 
                    key={indicator.id} 
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm opacity-60 hover:opacity-100 transition-opacity cursor-pointer flex flex-col justify-between h-40"
                    onClick={() => onGoToUpload()}
                  >
                    <div>
                      <h4 className="font-semibold text-slate-700 mb-1 line-clamp-2">{indicator.name}</h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-500">
                        Sem dados
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-xs text-slate-400">Clique para importar</span>
                      <UploadCloud size={18} className="text-slate-300" />
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={indicator.id} 
                  onClick={() => onSelectIndicator(indicator.id)}
                  className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-40 relative overflow-hidden ${getStatusColor(stats.status).split(' ')[2]}`}
                >
                  <div className={`absolute top-0 right-0 w-2 h-full ${getStatusColor(stats.status).split(' ')[1]}`}></div>
                  
                  <div className="flex justify-between items-start">
                    <div className="pr-4">
                      <h4 className="font-semibold text-slate-800 mb-1 line-clamp-2">{indicator.name}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusIcon(stats.status)}
                        <span className="text-2xl font-bold text-slate-900">
                          {stats.mediaPontuacao.toFixed(1)}{!stats.isCvat && '%'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex gap-3 text-xs">
                      <div className="flex items-center gap-1" title="Equipes Adequadas">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-600 font-medium">{stats.successCount}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Equipes em Atenção">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-slate-600 font-medium">{stats.warningCount}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Equipes Críticas">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-slate-600 font-medium">{stats.dangerCount}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-indigo-600 text-xs font-medium">
                      Detalhes <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
