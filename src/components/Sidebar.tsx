import React from 'react';
import { Activity, Upload, Settings, PieChart, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PREDEFINED_INDICATORS } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ currentTab, onTabChange }: SidebarProps) {
  const mainTabs = [
    { id: 'dashboard', label: 'Visão Geral', icon: PieChart },
    { id: 'upload', label: 'Importar SIAPS', icon: Upload },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  // Group indicators
  const groups = PREDEFINED_INDICATORS.reduce((acc, ind) => {
    if (!acc[ind.group]) acc[ind.group] = [];
    acc[ind.group].push(ind);
    return acc;
  }, {} as Record<string, typeof PREDEFINED_INDICATORS>);

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800 overflow-y-auto">
      <div className="p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity className="text-emerald-500" />
          Saúde Brasil 360°
        </h1>
        <p className="text-xs text-slate-500 mt-1">Monitoramento Novo PAC</p>
      </div>
      
      <nav className="p-4 space-y-2">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium",
                isActive 
                  ? "bg-emerald-500/10 text-emerald-400" 
                  : "hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 px-4 pb-4">
        {Object.entries(groups).map(([groupName, indicators]) => (
          <div key={groupName} className="mb-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-4">
              {groupName}
            </h3>
            <div className="space-y-1">
              {indicators.map(ind => {
                const tabId = `ind_${ind.id}`;
                const isActive = currentTab === tabId;
                return (
                  <button
                    key={ind.id}
                    onClick={() => onTabChange(tabId)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors text-sm",
                      isActive 
                        ? "bg-slate-800 text-white font-medium" 
                        : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                    )}
                  >
                    <span className="truncate text-left">{ind.name}</span>
                    {isActive && <ChevronRight size={14} className="text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900">
        <div className="bg-slate-800 rounded-xl p-4 text-xs">
          <p className="text-slate-400 mb-2">Sistema SIAPS Integrado</p>
          <div className="flex items-center gap-2 text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </div>
        </div>
      </div>
    </div>
  );
}
