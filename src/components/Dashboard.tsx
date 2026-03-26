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
    totalAcompanhadas = data.reduce((acc, curr) => acc + (parseFloat(String((curr.raw && curr.raw['TOTAL DE PESSOAS ACOMPANHADAS']) || '0').replace(/\./g, '').replace(',', '.')) || 0), 0);
    totalParametro = data.reduce((acc, curr) => acc + (parseFloat(String((curr.raw && curr.raw['PARÂMETRO POPULACIONAL']) || '0').replace(/\./g, '').replace(',', '.')) || 0), 0);
  } else {
    totalNumerador = data.reduce((acc, curr) => acc + Number(curr.numerador || 0), 0);
    totalDenominador = data.reduce((acc, curr) => acc + Number(curr.denominador || 0), 0);
  }

  const mediaPontuacao = data.reduce((acc, curr) => acc + Number(curr.pontuacao || 0), 0) / (totalEquipes || 1);

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
  const topEquipes = [...data].sort((a, b) => Number(b.pontuacao || 0) - Number(a.pontuacao || 0)).slice(0, 10);

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full overflow-y-auto pb-12">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Visão Geral - {indicatorName}</h2>
          <p className="text-gray-500 text-sm mt-1">Monitoramento de Desempenho</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isCvat ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-gray-500">Total de Equipes</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
              <Activity size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">{totalEquipes}</p>
          </div>
        </div>
        
        {isCvat ? (
          <>
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-500">Pessoas Acompanhadas</p>
                <div className="p-2 bg-green-50 text-green-600 rounded-md">
                  <Users size={20} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900">{totalAcompanhadas.toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-500">Parâmetro Populacional</p>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-md">
                  <Target size={20} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900">{totalParametro.toLocaleString('pt-BR')}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-500">Numerador Total</p>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-md">
                  <Users size={20} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900">{totalNumerador.toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-500">Denominador Total</p>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-md">
                  <Target size={20} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900">{totalDenominador.toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-500">Equipes Adequadas</p>
                <div className="p-2 bg-green-50 text-green-600 rounded-md">
                  <CheckCircle size={20} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900">{success}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-500">Equipes Críticas</p>
                <div className="p-2 bg-red-50 text-red-600 rounded-md">
                  <Target size={20} />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900">{danger}</p>
              </div>
            </div>
          </>
        )}

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium text-gray-500">Média de Pontuação</p>
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-md">
              <CheckCircle size={20} />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">
              {mediaPontuacao.toFixed(2)}{!isCvat && '%'}
            </p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Distribuição de Status (Pontuação)</h3>
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
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                />
                <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Tipos de Estabelecimento</h3>
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
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Indicators Bar Chart */}
      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Equipes por Pontuação</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topEquipes} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
              <XAxis type="number" domain={[0, isCvat ? 10 : 100]} axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
              <YAxis dataKey="nomeEquipe" type="category" width={200} axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 11}} />
              <Tooltip 
                cursor={{fill: '#f9fafb'}}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
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
