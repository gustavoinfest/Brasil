import React, { useState } from 'react';
import { Settings as SettingsIcon, Database, Bell, Shield, Users, CheckCircle, Save, Trash2, AlertTriangle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

  // Form states
  const [apiUrl, setApiUrl] = useState('https://api.saude.gov.br/siaps/v1');
  const [autoSync, setAutoSync] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');

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
      case 'security':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Segurança da Conta</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">Autenticação em Duas Etapas (2FA)</h4>
                  <p className="text-xs text-slate-500 mt-1">Adiciona uma camada extra de segurança</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={twoFactorAuth} onChange={(e) => setTwoFactorAuth(e.target.checked)} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tempo de Expiração da Sessão (minutos)
                </label>
                <select 
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none bg-white"
                >
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="120">2 horas</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Usuários e Permissões</h3>
            
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-medium">Nome</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Papel</th>
                    <th className="px-4 py-3 font-medium text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900">Admin Sistema</td>
                    <td className="px-4 py-3 text-slate-500">admin@saude.gov.br</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-medium">Administrador</span></td>
                    <td className="px-4 py-3 text-right"><button className="text-blue-600 hover:underline">Editar</button></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-slate-900">Gestor Municipal</td>
                    <td className="px-4 py-3 text-slate-500">gestor@municipio.gov.br</td>
                    <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">Gestor</span></td>
                    <td className="px-4 py-3 text-right"><button className="text-blue-600 hover:underline">Editar</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
              Adicionar Novo Usuário
            </button>
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
            onClick={() => setActiveTab('users')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-left transition-colors",
              activeTab === 'users' ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Users size={18} />
            Usuários e Permissões
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-left transition-colors",
              activeTab === 'security' ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:bg-slate-50"
            )}
          >
            <Shield size={18} />
            Segurança
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
