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
      case 'success': return 'text-emerald-600 bg-emerald-50/80 border-emerald-100 shadow-emerald-500/5';
      case 'warning': return 'text-amber-600 bg-amber-50/80 border-amber-100 shadow-amber-500/5';
      case 'danger': return 'text-rose-600 bg-rose-50/80 border-rose-100 shadow-rose-500/5';
      default: return 'text-slate-400 bg-slate-50/80 border-slate-100 shadow-slate-500/5';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={22} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={22} className="text-amber-500" />;
      case 'danger': return <XCircle size={22} className="text-rose-500" />;
      default: return <Activity size={22} className="text-slate-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-full overflow-y-auto pb-12">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight">
            {filterGroup ? `Visão Geral: ${filterGroup}` : 'Visão Geral dos Indicadores'}
          </h2>
          <p className="text-slate-500 text-base mt-2">Acompanhamento consolidado do município</p>
        </div>
        <button 
          onClick={onGoToUpload}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 text-sm font-medium shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30 hover:-translate-y-0.5"
        >
          <UploadCloud size={18} />
          Importar Dados
        </button>
      </div>

      {Object.entries(groupedIndicators).map(([group, indicators]) => (
        <div key={group} className="mb-12">
          {!filterGroup && (
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-xl font-display font-bold text-slate-800 tracking-tight">{group}</h3>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {indicators.map((indicator) => {
              const stats = getIndicatorStats(indicator.id);
              
              if (!stats) {
                return (
                  <div 
                    key={indicator.id} 
                    className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-[0_4px_20px_rgb(0,0,0,0.02)] opacity-70 hover:opacity-100 transition-all duration-300 cursor-pointer flex flex-col justify-between h-44 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] group"
                    onClick={() => onGoToUpload()}
                  >
                    <div>
                      <h4 className="font-display font-semibold text-slate-700 mb-2 line-clamp-2 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{indicator.name}</h4>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-500">
                        Sem dados
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100/50">
                      <span className="text-sm font-medium text-slate-400 group-hover:text-indigo-500 transition-colors">Clique para importar</span>
                      <UploadCloud size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                );
              }

              const colorClasses = getStatusColor(stats.status).split(' ');
              const textColor = colorClasses[0];
              const bgColor = colorClasses[1];
              const borderColor = colorClasses[2];
              const shadowColor = colorClasses[3];

              return (
                <div 
                  key={indicator.id} 
                  onClick={() => onSelectIndicator(indicator.id)}
                  className={`bg-white rounded-3xl p-6 border ${borderColor} shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all duration-300 cursor-pointer flex flex-col justify-between h-44 relative overflow-hidden hover:-translate-y-1 group`}
                >
                  <div className={`absolute top-0 right-0 w-3 h-full ${bgColor} border-l ${borderColor}`}></div>
                  
                  <div className="flex justify-between items-start">
                    <div className="pr-4">
                      <h4 className="font-display font-semibold text-slate-800 mb-2 line-clamp-2 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{indicator.name}</h4>
                      <div className="flex items-center gap-2.5 mt-3">
                        {getStatusIcon(stats.status)}
                        <span className="text-3xl font-display font-bold text-slate-900 tracking-tight">
                          {stats.mediaPontuacao.toFixed(1)}{!stats.isCvat && <span className="text-xl text-slate-400 font-medium ml-0.5">%</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1.5" title="Equipes Adequadas">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                        <span className="text-slate-600 font-medium">{stats.successCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Equipes em Atenção">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                        <span className="text-slate-600 font-medium">{stats.warningCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Equipes Críticas">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                        <span className="text-slate-600 font-medium">{stats.dangerCount}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-indigo-600 text-sm font-semibold opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      Detalhes <ChevronRight size={16} className="ml-0.5" />
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
