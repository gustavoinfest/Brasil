import React, { useState } from 'react';
import { TeamData } from '../types';
import { Search, Filter, ArrowUpDown, CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface IndicatorsListProps {
  data: TeamData[];
  indicatorName?: string;
  isCvat?: boolean;
}

export function IndicatorsList({ data, indicatorName = 'Indicador', isCvat = false }: IndicatorsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.nomeEquipe.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.cnes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.estabelecimento.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={18} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={18} className="text-amber-500" />;
      case 'danger': return <XCircle size={18} className="text-red-500" />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    if (isCvat) {
      switch (status) {
        case 'success': return 'Atingido (>=7)';
        case 'warning': return 'Atenção (4-6.9)';
        case 'danger': return 'Crítico (<4)';
        default: return status;
      }
    } else {
      switch (status) {
        case 'success': return 'Adequado (>=60%)';
        case 'warning': return 'Atenção (40-59%)';
        case 'danger': return 'Crítico (<40%)';
        default: return status;
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedTeam(prev => prev === id ? null : id);
  };

  const getBoasPraticas = (raw: any) => {
    const knownKeys = [
      'CNES', 'ESTABELECIMENTO', 'TIPO DO ESTABELECIMENTO', 'INE', 'NOME DA EQUIPE', 
      'SIGLA DA EQUIPE', 'NUMERADOR', 'DENOMINADOR', 
      'DENOMINADOR ESTIMADO', 'DENOMINADOR INFORMADO', 
      'TOTAL DE PESSOAS ACOMPANHADAS', 'PARÂMETRO POPULACIONAL'
    ];
    
    return Object.entries(raw).filter(([key, value]) => {
      const upperKey = key.toUpperCase().trim();
      
      const isKnownKey = knownKeys.includes(upperKey);
      const isPontuacaoKey = upperKey.includes('PONTUAÇÃO') || 
                             upperKey.includes('RESULTADO') || 
                             upperKey.includes('RAZÃO ENTRE O NUMERADOR E DENOMINADOR') ||
                             upperKey.includes('SOMATÓRIO DA BOA PRÁTICA');
                             
      return !isKnownKey && !isPontuacaoKey && value !== '' && value !== null && value !== undefined;
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Desempenho por Equipe</h2>
          <p className="text-slate-500 text-sm mt-1">Detalhamento de {indicatorName}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar equipe, CNES..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              <option value="all">Todos os Status</option>
              <option value="success">{isCvat ? 'Atingido' : 'Adequado'}</option>
              <option value="warning">Atenção</option>
              <option value="danger">Crítico</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Equipe / Estabelecimento <ArrowUpDown size={14} className="inline ml-1" /></th>
                {isCvat && (
                  <>
                    <th className="p-4 font-semibold text-right">Parâmetro Pop.</th>
                    <th className="p-4 font-semibold text-right">Pessoas Acompanhadas</th>
                  </>
                )}
                {!isCvat && (
                  <>
                    <th className="p-4 font-semibold text-right">Numerador</th>
                    <th className="p-4 font-semibold text-right">Denominador</th>
                  </>
                )}
                <th className="p-4 font-semibold text-right">Pontuação</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Boas Práticas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? (
                filteredData.map((indicator) => (
                  <React.Fragment key={indicator.id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">{indicator.nomeEquipe || 'Sem Nome'}</div>
                        <div className="text-xs text-slate-500 mt-1">{indicator.estabelecimento} (CNES: {indicator.cnes})</div>
                      </td>
                      {isCvat && (
                        <>
                          <td className="p-4 text-right font-medium text-slate-700">
                            {parseFloat(indicator.raw['PARÂMETRO POPULACIONAL'] || '0').toLocaleString('pt-BR')}
                          </td>
                          <td className="p-4 text-right font-medium text-slate-900">
                            {parseFloat(indicator.raw['TOTAL DE PESSOAS ACOMPANHADAS'] || '0').toLocaleString('pt-BR')}
                          </td>
                        </>
                      )}
                      {!isCvat && (
                        <>
                          <td className="p-4 text-right font-medium text-slate-700">
                            {(indicator.numerador || 0).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-4 text-right font-medium text-slate-900">
                            {(indicator.denominador || 0).toLocaleString('pt-BR')}
                          </td>
                        </>
                      )}
                      <td className="p-4 text-right">
                        <span className="font-bold text-slate-900">{indicator.pontuacao.toFixed(2)}{!isCvat && '%'}</span>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                          ${indicator.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            indicator.status === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                            'bg-red-50 text-red-700 border-red-200'}`}
                        >
                          {getStatusIcon(indicator.status)}
                          {getStatusText(indicator.status)}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => toggleExpand(indicator.id)} 
                          className={`p-1.5 rounded-lg transition-colors ${expandedTeam === indicator.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                          title="Ver Boas Práticas e Detalhes"
                        >
                          {expandedTeam === indicator.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </td>
                    </tr>
                    {expandedTeam === indicator.id && (
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <td colSpan={isCvat ? 6 : 6} className="p-6">
                          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                            <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                              <Info size={16} className="text-indigo-500" /> 
                              Boas Práticas e Detalhamento do Indicador
                            </h4>
                            {getBoasPraticas(indicator.raw).length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getBoasPraticas(indicator.raw).map(([key, value]) => (
                                  <div key={key} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <p className="text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">{key}</p>
                                    <p className="text-sm text-slate-900 font-medium">{String(value)}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500">Nenhum dado adicional de boas práticas encontrado na planilha para esta equipe.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={isCvat ? 6 : 6} className="p-8 text-center text-slate-500">
                    Nenhuma equipe encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-sm text-slate-500 flex justify-between items-center">
          <span>Mostrando {filteredData.length} de {data.length} equipes</span>
        </div>
      </div>
    </div>
  );
}
