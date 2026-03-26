import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, Database, Bell, Save, Trash2, AlertTriangle, Download, Upload as UploadIcon, CheckCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import localforage from 'localforage';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SettingsProps {
  onClearData?: () => void;
}

export function Settings({ onClearData }: SettingsProps) {
  const [activeTab, setActiveTab] = useState('integration');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [apiUrl, setApiUrl] = useState('https://api.saude.gov.br/siaps/v1');
  const [autoSync, setAutoSync] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const handleClearData = () => {
    if (onClearData) {
      onClearData();
      setShowClearConfirm(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const data = await localforage.getItem('all_datasets');
      const blob = new Blob([JSON.stringify(data || {})], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saude-brasil-360-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar backup:", error);
      alert("Erro ao exportar backup.");
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        await localforage.setItem('all_datasets', data);
        window.location.reload(); // Reload to apply the imported data
      } catch (error) {
        console.error("Erro ao importar backup:", error);
        alert("Arquivo de backup inválido ou corrompido.");
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'integration':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Integração com SIAPS</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  URL da API do SIAPS
                </label>
                <input 
                  type="text" 
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="https://api.saude.gov.br/siaps/v1" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Sincronização Automática</h4>
                  <p className="text-xs text-slate-500 mt-1">Baixar relatórios automaticamente diariamente</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-sm font-medium text-slate-900 mb-4">Gerenciamento de Dados Locais</h4>
              <p className="text-sm text-slate-500 mb-4">
                Os dados importados ficam salvos no armazenamento interno do seu navegador (IndexedDB). 
                Isso garante que nada seja enviado para a nuvem sem sua permissão.
              </p>
              
              {showClearConfirm ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-600 mt-0.5" size={20} />
                    <div>
                      <h5 className="text-sm font-semibold text-red-800">Tem certeza?</h5>
                      <p className="text-xs text-red-600 mt-1 mb-3">
                        Isso apagará todos os relatórios importados do seu navegador. Esta ação não pode ser desfeita.
                      </p>
                      <div className="flex gap-3">
                        <button 
                          onClick={handleClearData}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Sim, apagar tudo
                        </button>
                        <button 
                          onClick={() => setShowClearConfirm(false)}
                          className="px-3 py-1.5 bg-white text-slate-700 border border-slate-300 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                  Limpar todos os dados salvos
                </button>
              )}
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Preferências de Notificação</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Notificações por E-mail</h4>
                  <p className="text-xs text-slate-500 mt-1">Receber alertas sobre indicadores críticos</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Notificações por SMS</h4>
                  <p className="text-xs text-slate-500 mt-1">Alertas urgentes no celular cadastrado</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={smsNotifications} onChange={(e) => setSmsNotifications(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </div>
        );
      case 'backup':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Backup e Restauração</h3>
            
            <div className="space-y-6">
              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                    <Download size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-medium text-slate-900">Exportar Backup</h4>
                    <p className="text-sm text-slate-500 mt-1 mb-4">
                      Baixe um arquivo contendo todos os dados e indicadores atualmente salvos no sistema.
                    </p>
                    <button 
                      onClick={handleExportBackup}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      <Download size={16} />
                      Fazer Download do Backup
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                    <UploadIcon size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base font-medium text-slate-900">Restaurar Backup</h4>
                    <p className="text-sm text-slate-500 mt-1 mb-4">
                      Restaure os dados a partir de um arquivo de backup previamente exportado. <br/>
                      <strong className="text-amber-600">Atenção:</strong> Isso substituirá todos os dados atuais.
                    </p>
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleImportBackup}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                      <UploadIcon size={16} />
                      Selecionar Arquivo de Backup
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="text-slate-400" />
          Configurações do Sistema
        </h2>
        <p className="text-slate-500 mt-2">
          Gerencie as preferências e integrações do Monitoramento Saúde Brasil 360°.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveTab('integration')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-left transition-colors",
              activeTab === 'integration' ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Database size={18} />
            Integração SIAPS
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-left transition-colors",
              activeTab === 'notifications' ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Bell size={18} />
            Notificações
          </button>
          <button 
            onClick={() => setActiveTab('backup')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-left transition-colors",
              activeTab === 'backup' ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Save size={18} />
            Backup e Restauração
          </button>
        </div>

        <div className="md:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex-1">
            {renderContent()}
          </div>

          <div className="border-t border-slate-200 pt-6 mt-8 flex items-center justify-between">
            <div>
              {showSuccess && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium animate-in slide-in-from-left-2">
                  <CheckCircle size={16} />
                  Configurações salvas com sucesso!
                </div>
              )}
            </div>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
