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
      (item.nomeEquipe || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (item.cnes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.estabelecimento || '').toLowerCase().includes(searchTerm.toLowerCase());
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
    if (!raw) return [];
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
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col overflow-y-auto pb-12">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Desempenho por Equipe</h2>
          <p className="text-gray-500 text-sm mt-1">Detalhamento de {indicatorName}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar equipe, CNES..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-10 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none text-gray-700 cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="success">{isCvat ? 'Atingido' : 'Adequado'}</option>
              <option value="warning">Atenção</option>
              <option value="danger">Crítico</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                <th className="p-4 font-medium">Equipe / Estabelecimento <ArrowUpDown size={14} className="inline ml-1 text-gray-400" /></th>
                {isCvat ? (
                  <>
                    <th className="p-4 font-medium text-right">Parâmetro Pop.</th>
                    <th className="p-4 font-medium text-right">Pessoas Acompanhadas</th>
                  </>
                ) : (
                  <>
                    <th className="p-4 font-medium text-right">Numerador</th>
                    <th className="p-4 font-medium text-right">Denominador</th>
                  </>
                )}
                <th className="p-4 font-medium text-right">Pontuação</th>
                <th className="p-4 font-medium text-center">Status</th>
                <th className="p-4 font-medium text-center">Boas Práticas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.length > 0 ? (
                filteredData.map((indicator) => (
                  <React.Fragment key={indicator.id}>
                    <tr className="hover:bg-gray-50 transition-colors group">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{indicator.nomeEquipe || 'Sem Nome'}</div>
                        <div className="text-xs text-gray-500 mt-1">{indicator.estabelecimento} <span className="text-gray-400 ml-1">(CNES: {indicator.cnes})</span></div>
                      </td>
                      {isCvat ? (
                        <>
                          <td className="p-4 text-right text-gray-600">
                            {parseFloat((indicator.raw && indicator.raw['PARÂMETRO POPULACIONAL']) || '0').toLocaleString('pt-BR')}
                          </td>
                          <td className="p-4 text-right text-gray-900">
                            {parseFloat((indicator.raw && indicator.raw['TOTAL DE PESSOAS ACOMPANHADAS']) || '0').toLocaleString('pt-BR')}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-4 text-right text-gray-600">
                            {Number(indicator.numerador || 0).toLocaleString('pt-BR')}
                          </td>
                          <td className="p-4 text-right text-gray-900">
                            {Number(indicator.denominador || 0).toLocaleString('pt-BR')}
                          </td>
                        </>
                      )}
                      <td className="p-4 text-right">
                        <span className="text-lg font-bold text-gray-900">{Number(indicator.pontuacao || 0).toFixed(2)}{!isCvat && <span className="text-sm text-gray-500 ml-1">%</span>}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
                          ${indicator.status === 'success' ? 'bg-green-100 text-green-800' : 
                            indicator.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'}`}
                        >
                          {getStatusIcon(indicator.status)}
                          {getStatusText(indicator.status)}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => toggleExpand(indicator.id)} 
                          className={`p-2 rounded-md transition-colors ${expandedTeam === indicator.id ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                          title="Ver Boas Práticas e Detalhes"
                        >
                          {expandedTeam === indicator.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </td>
                    </tr>
                    {expandedTeam === indicator.id && (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan={isCvat ? 6 : 6} className="p-6">
                          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                <Info size={18} className="text-blue-500" /> 
                              </div>
                              Boas Práticas e Detalhamento do Indicador
                            </h4>
                            {getBoasPraticas(indicator.raw).length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getBoasPraticas(indicator.raw).map(([key, value]) => (
                                  <div key={key} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                    <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{key}</p>
                                    <p className="text-sm text-gray-900">{String(value)}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6 bg-gray-50 rounded-md border border-gray-200 border-dashed">
                                <p className="text-sm text-gray-500">Nenhum dado adicional de boas práticas encontrado na planilha para esta equipe.</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={isCvat ? 6 : 6} className="p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <Search size={24} className="text-gray-400" />
                    </div>
                    <p className="text-gray-900 font-medium text-lg">Nenhuma equipe encontrada</p>
                    <p className="text-gray-500 text-sm mt-1">Tente ajustar os filtros de busca.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-sm text-gray-500 flex justify-between items-center">
          <span>Mostrando <span className="text-gray-900 font-medium">{filteredData.length}</span> de <span className="text-gray-900 font-medium">{data.length}</span> equipes</span>
        </div>
      </div>
    </div>
  );
}
