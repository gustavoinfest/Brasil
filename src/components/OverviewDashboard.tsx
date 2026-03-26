import React from 'react';
import { IndicatorDataset, PREDEFINED_INDICATORS } from '../types';
import { Activity, CheckCircle, AlertTriangle, XCircle, ChevronRight, UploadCloud } from 'lucide-react';

interface OverviewDashboardProps {
  datasets: Record<string, IndicatorDataset>;
  onSelectIndicator: (id: string) => void;
  onGoToUpload: () => void;
  filterGroup?: string;
}

export function OverviewDashboard({ datasets, onSelectIndicator, onGoToUpload, filterGroup }: OverviewDashboardProps) {
  // Group indicators by their group
  let groupedIndicators = PREDEFINED_INDICATORS.reduce((acc, indicator) => {
    if (!acc[indicator.group]) {
      acc[indicator.group] = [];
    }
    acc[indicator.group].push(indicator);
    return acc;
  }, {} as Record<string, typeof PREDEFINED_INDICATORS>);

  // Add custom datasets
  Object.values(datasets).forEach(ds => {
    if (!PREDEFINED_INDICATORS.find(i => i.id === ds.id)) {
      if (!groupedIndicators['Outros']) groupedIndicators['Outros'] = [];
      groupedIndicators['Outros'].push({ id: ds.id, name: ds.name, group: 'Outros', match: '' });
    }
  });

  if (filterGroup && groupedIndicators[filterGroup]) {
    groupedIndicators = { [filterGroup]: groupedIndicators[filterGroup] };
  }

  const getIndicatorStats = (id: string) => {
    const dataset = datasets[id];
    if (!dataset || !dataset.data || dataset.data.length === 0) return null;

    const data = dataset.data;
    const totalEquipes = data.length;
    const isCvat = id === 'cvat';
    
    const mediaPontuacao = data.reduce((acc, curr) => acc + (curr.pontuacao || 0), 0) / totalEquipes;
    
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
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'danger': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={20} className="text-green-500" />;
      case 'warning': return <AlertTriangle size={20} className="text-yellow-500" />;
      case 'danger': return <XCircle size={20} className="text-red-500" />;
      default: return <Activity size={20} className="text-gray-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-full overflow-y-auto pb-12">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {filterGroup ? `Visão Geral: ${filterGroup}` : 'Visão Geral dos Indicadores'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">Acompanhamento consolidado do município</p>
        </div>
        <button 
          onClick={onGoToUpload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          <UploadCloud size={16} />
          Importar Dados
        </button>
      </div>

      {Object.entries(groupedIndicators).map(([group, indicators]) => (
        <div key={group} className="mb-10">
          {!filterGroup && (
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-lg font-bold text-gray-800">{group}</h3>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {indicators.map((indicator) => {
              const stats = getIndicatorStats(indicator.id);
              
              if (!stats) {
                return (
                  <div 
                    key={indicator.id} 
                    className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm opacity-60 hover:opacity-100 transition-opacity cursor-pointer flex flex-col justify-between h-40"
                    onClick={() => onGoToUpload()}
                  >
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2 line-clamp-2">{indicator.name}</h4>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Sem dados
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                      <span className="text-sm text-gray-500">Clique para importar</span>
                      <UploadCloud size={18} className="text-gray-400" />
                    </div>
                  </div>
                );
              }

              const colorClasses = getStatusColor(stats.status).split(' ');
              const textColor = colorClasses[0];
              const bgColor = colorClasses[1];
              const borderColor = colorClasses[2];

              return (
                <div 
                  key={indicator.id} 
                  onClick={() => onSelectIndicator(indicator.id)}
                  className={`bg-white rounded-lg p-5 border ${borderColor} shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between h-40 relative overflow-hidden`}
                >
                  <div className={`absolute top-0 right-0 w-2 h-full ${bgColor} border-l ${borderColor}`}></div>
                  
                  <div className="flex justify-between items-start">
                    <div className="pr-4">
                      <h4 className="font-semibold text-gray-800 mb-1 line-clamp-2">{indicator.name}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusIcon(stats.status)}
                        <span className="text-2xl font-bold text-gray-900">
                          {stats.mediaPontuacao.toFixed(1)}{!stats.isCvat && '%'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="flex gap-3 text-sm">
                      <div className="flex items-center gap-1" title="Equipes Adequadas">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-gray-600 font-medium">{stats.successCount}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Equipes em Atenção">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        <span className="text-gray-600 font-medium">{stats.warningCount}</span>
                      </div>
                      <div className="flex items-center gap-1" title="Equipes Críticas">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-gray-600 font-medium">{stats.dangerCount}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-blue-600 text-sm font-medium">
                      Detalhes <ChevronRight size={16} />
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
