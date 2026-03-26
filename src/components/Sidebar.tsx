import React, { useState, useEffect } from 'react';
import { Activity, Upload, Settings, PieChart, ChevronRight, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { PREDEFINED_INDICATORS } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  datasets?: Record<string, any>;
}

export function Sidebar({ currentTab, onTabChange, datasets = {} }: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Geral': true,
    'eSF/eAP': false,
    'eSB': false,
    'Outros': true
  });

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

  // Add custom datasets
  Object.values(datasets).forEach(ds => {
    if (!PREDEFINED_INDICATORS.find(i => i.id === ds.id)) {
      if (!groups['Outros']) groups['Outros'] = [];
      groups['Outros'].push({ id: ds.id, name: ds.name, group: 'Outros', match: '' });
    }
  });

  // Auto-expand group if it contains the active tab
  useEffect(() => {
    if (currentTab.startsWith('ind_')) {
      const indId = currentTab.replace('ind_', '');
      const activeIndicator = PREDEFINED_INDICATORS.find(i => i.id === indId);
      if (activeIndicator && !expandedGroups[activeIndicator.group]) {
        setExpandedGroups(prev => ({ ...prev, [activeIndicator.group]: true }));
      }
    }
  }, [currentTab]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
    onTabChange(`group_${groupName}`);
  };

  return (
    <div className="w-72 bg-[#0B1120] text-slate-300 flex flex-col h-full border-r border-slate-800/50 overflow-y-auto shadow-2xl">
      <div className="p-6 border-b border-slate-800/50 sticky top-0 bg-[#0B1120]/95 backdrop-blur-sm z-10">
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-3 tracking-tight">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Activity size={20} className="text-white" />
          </div>
          Saúde 360°
        </h1>
        <p className="text-xs text-indigo-300/70 mt-2 font-medium tracking-wide uppercase">Monitoramento Novo PAC</p>
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
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium",
                isActive 
                  ? "bg-indigo-500/15 text-indigo-400 shadow-inner border border-indigo-500/20" 
                  : "hover:bg-slate-800/50 hover:text-white border border-transparent"
              )}
            >
              <Icon size={18} className={isActive ? "text-indigo-400" : "text-slate-400"} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 px-4 pb-4">
        {Object.entries(groups).map(([groupName, indicators]) => {
          const isExpanded = expandedGroups[groupName];
          
          return (
            <div key={groupName} className="mb-2">
              <button 
                onClick={() => toggleGroup(groupName)}
                className={cn(
                  "w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest py-3 px-4 transition-colors rounded-xl",
                  currentTab === `group_${groupName}` 
                    ? "bg-slate-800/80 text-indigo-400" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/30"
                )}
              >
                <span>{groupName}</span>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              
              {isExpanded && (
                <div className="space-y-1 mt-1 pl-2">
                  {indicators.map(ind => {
                    const tabId = `ind_${ind.id}`;
                    const isActive = currentTab === tabId;
                    return (
                      <button
                        key={ind.id}
                        onClick={() => onTabChange(tabId)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 text-sm",
                          isActive 
                            ? "bg-slate-800/80 text-white font-medium border border-slate-700/50 shadow-sm" 
                            : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"
                        )}
                      >
                        <span className="truncate text-left">{ind.name}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800/50 sticky bottom-0 bg-[#0B1120]/95 backdrop-blur-sm">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 text-xs backdrop-blur-md">
          <p className="text-slate-400 mb-2 font-medium">Sistema SIAPS Integrado</p>
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            Online e Sincronizado
          </div>
        </div>
      </div>
    </div>
  );
}
