import React, { useMemo } from 'react';
import { TeamData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';
import { Activity, CheckCircle, Users, Target } from 'lucide-react';

interface DashboardProps {
  data: TeamData[];
  indicatorName?: string;
  isCvat?: boolean;
}

export function Dashboard({ data, indicatorName = 'Indicador', isCvat = false }: DashboardProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Activity size={48} className="mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">Nenhum dado disponível</h2>
        <p className="mt-2 text-sm">Por favor, importe o relatório do SIAPS na aba "Importar SIAPS".</p>
      </div>
    );
  }

  const totalEquipes = data.length;
  
  // For CVAT we sum specific columns, for others we might just show averages
  let totalAcompanhadas = 0;
  let totalParametro = 0;
  let totalNumerador = 0;
  let totalDenominador = 0;
  
  if (isCvat) {
    totalAcompanhadas = data.reduce((acc, curr) => acc + (parseFloat(String(curr.raw['TOTAL DE PESSOAS ACOMPANHADAS'] || '0').replace(/\./g, '').replace(',', '.')) || 0), 0);
    totalParametro = data.reduce((acc, curr) => acc + (parseFloat(String(curr.raw['PARÂMETRO POPULACIONAL'] || '0').replace(/\./g, '').replace(',', '.')) || 0), 0);
  } else {
    totalNumerador = data.reduce((acc, curr) => acc + (curr.numerador || 0), 0);
    totalDenominador = data.reduce((acc, curr) => acc + (curr.denominador || 0), 0);
  }

  const mediaPontuacao = data.reduce((acc, curr) => acc + curr.pontuacao, 0) / (totalEquipes || 1);

  const success = data.filter(d => d.status === 'success').length;
  const warning = data.filter(d => d.status === 'warning').length;
  const danger = data.filter(d => d.status === 'danger').length;

  const statusData = [
    { name: isCvat ? 'Atingido (>=7)' : 'Adequado (>=60%)', value: success, color: '#10b981' },
    { name: isCvat ? 'Atenção (4-6.9)' : 'Atenção (40-59%)', value: warning, color: '#f59e0b' },
    { name: isCvat ? 'Crítico (<4)' : 'Crítico (<40%)', value: danger, color: '#ef4444' },
  ];

  // Group by Tipo de Equipe
  const tipoEquipeMap = data.reduce((acc, curr) => {
    const tipo = curr.tipoEstabelecimento || 'Outros';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tipoEquipeData = Object.entries(tipoEquipeMap).map(([name, value]) => ({
    name, value
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];

  // Top 10 equipes por pontuação
  const topEquipes = [...data].sort((a, b) => b.pontuacao - a.pontuacao).slice(0, 10);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Visão Geral - {indicatorName}</h2>
          <p className="text-slate-500 text-sm mt-1">Monitoramento de Desempenho</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isCvat ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total de Equipes</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{totalEquipes}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Activity size={24} />
          </div>
        </div>
        
        {isCvat ? (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Pessoas Acompanhadas</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">{totalAcompanhadas.toLocaleString('pt-BR')}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Users size={24} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Parâmetro Populacional</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{totalParametro.toLocaleString('pt-BR')}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Target size={24} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Numerador Total</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{totalNumerador.toLocaleString('pt-BR')}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users size={24} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Denominador Total</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{totalDenominador.toLocaleString('pt-BR')}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <Target size={24} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Equipes Adequadas</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">{success}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle size={24} />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Equipes Críticas</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{danger}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <Target size={24} />
              </div>
            </div>
          </>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Média de Pontuação</p>
            <p className="text-3xl font-bold text-amber-500 mt-2">
              {mediaPontuacao.toFixed(2)}{!isCvat && '%'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
            <CheckCircle size={24} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Distribuição de Status (Pontuação)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Tipos de Estabelecimento</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={tipoEquipeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {tipoEquipeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Indicators Bar Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Top 10 Equipes por Pontuação</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topEquipes} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" domain={[0, isCvat ? 10 : 100]} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <YAxis dataKey="nomeEquipe" type="category" width={200} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend iconType="circle" />
              <Bar dataKey="pontuacao" name="Pontuação" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
