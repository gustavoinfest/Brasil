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
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto">
      <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Activity className="text-blue-600" />
          Saúde 360°
        </h1>
        <p className="text-xs text-gray-500 mt-1">Monitoramento Novo PAC</p>
      </div>
      
      <nav className="p-4 space-y-1">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive 
                  ? "bg-blue-50 text-blue-700" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon size={18} className={isActive ? "text-blue-600" : "text-gray-400"} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 px-4 pb-4">
        {Object.entries(groups).map(([groupName, indicators]) => {
          const isExpanded = expandedGroups[groupName];
          return (
            <div key={groupName} className="mb-4">
              <button
                onClick={() => toggleGroup(groupName)}
                className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2 hover:text-gray-700 transition-colors"
              >
                <span>{groupName}</span>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              
              {isExpanded && (
                <div className="space-y-1">
                  {indicators.map((indicator) => {
                    const isActive = currentTab === `ind_${indicator.id}`;
                    const hasData = datasets[`ind_${indicator.id}`]?.data?.length > 0;
                    
                    return (
                      <button
                        key={indicator.id}
                        onClick={() => onTabChange(`ind_${indicator.id}`)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left",
                          isActive
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}
                      >
                        <span className="truncate pr-2">{indicator.name}</span>
                        {hasData && (
                          <span className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            isActive ? "bg-blue-500" : "bg-green-500"
                          )} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
