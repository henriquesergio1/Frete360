
import React, { useState, useContext, useEffect } from 'react';
import { DataContext } from '../context/DataContext.tsx';
import { GestaoUsuarios } from './GestaoUsuarios.tsx';
import { CogIcon, UserGroupIcon, PhotographIcon, CheckCircleIcon, DocumentReportIcon, SpinnerIcon, ExclamationIcon } from './icons.tsx';
import { getCurrentMode, toggleMode, getSystemStatus, updateLicense } from '../services/apiService.ts';
import { LicenseStatus } from '../types.ts';

// --- Componente de Licença ---
const LicenseControl: React.FC = () => {
    const [status, setStatus] = useState<LicenseStatus | null>(null);
    const [inputKey, setInputKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            const s = await getSystemStatus();
            setStatus(s);
        } catch (e) {
            console.error(e);
        }
    };

    const handleActivate = async () => {
        if (!inputKey.trim()) return;
        setLoading(true);
        setMessage(null);
        try {
            const res = await updateLicense(inputKey);
            setMessage({ type: 'success', text: res.message });
            setInputKey('');
            loadStatus();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Erro ao ativar licença.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                        <DocumentReportIcon className="w-6 h-6 mr-2 text-sky-400"/> 
                        Status da Licença
                    </h3>
                    
                    {!status ? (
                        <p className="text-slate-400">Carregando...</p>
                    ) : (
                        <div className={`p-4 rounded-md border ${status.status === 'ACTIVE' ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                            <div className="mb-2">
                                <span className="text-sm text-slate-400">Situação:</span>
                                <p className={`font-bold text-lg ${status.status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}`}>
                                    {status.status === 'ACTIVE' ? 'ATIVA' : (status.status === 'EXPIRED' ? 'EXPIRADA (Modo Leitura)' : 'INVÁLIDA / NÃO REGISTRADA')}
                                </p>
                            </div>
                            {status.client && (
                                <div className="mb-2">
                                    <span className="text-sm text-slate-400">Cliente:</span>
                                    <p className="text-white font-medium">{status.client}</p>
                                </div>
                            )}
                            {status.expiresAt && (
                                <div>
                                    <span className="text-sm text-slate-400">Vencimento:</span>
                                    <p className="text-white font-medium">{new Date(status.expiresAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {status?.status === 'MISSING' && (
                         <div className="mt-4 p-3 bg-yellow-900/30 text-yellow-200 text-sm rounded border border-yellow-600/30 flex items-start">
                            <ExclamationIcon className="w-5 h-5 mr-2 shrink-0" />
                            <span>O sistema está bloqueado até que uma licença válida seja inserida. Entre em contato com o desenvolvedor.</span>
                         </div>
                    )}

                    {status?.status === 'EXPIRED' && (
                         <div className="mt-4 p-3 bg-orange-900/30 text-orange-200 text-sm rounded border border-orange-600/30 flex items-start">
                            <ExclamationIcon className="w-5 h-5 mr-2 shrink-0" />
                            <span>Sua licença expirou. O sistema está operando em MODO LEITURA. Você pode consultar dados, mas não pode criar novos registros.</span>
                         </div>
                    )}
                </div>

                <div className="bg-slate-900/50 p-4 rounded-md border border-slate-700">
                    <h4 className="font-bold text-white mb-2">Ativar / Renovar Licença</h4>
                    <p className="text-sm text-slate-400 mb-4">Cole abaixo a chave de licença fornecida pelo administrador do sistema.</p>
                    
                    <textarea 
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value)}
                        className="w-full bg-slate-800 text-white border border-slate-600 rounded-md p-3 text-xs font-mono h-32 focus:ring-sky-500 focus:border-sky-500 mb-4"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />

                    <div className="flex flex-col gap-3">
                         <button 
                            onClick={handleActivate}
                            disabled={loading || !inputKey}
                            className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center justify-center"
                        >
                            {loading ? <SpinnerIcon className="w-5 h-5 mr-2"/> : <CheckCircleIcon className="w-5 h-5 mr-2"/>}
                            Validar Licença
                        </button>
                        
                        <a 
                            href="mailto:henriquesergio@example.com?subject=Solicitação de Licença Frete360&body=Olá, gostaria de solicitar uma nova licença para o sistema Frete360."
                            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-2 px-4 rounded-md transition duration-200 text-center text-sm"
                        >
                            Solicitar Licença via E-mail
                        </a>
                    </div>

                    {message && (
                        <div className={`mt-4 p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Componente de Marca/Identidade Visual ---
const SystemBranding: React.FC = () => {
    const { systemConfig, updateSystemConfig } = useContext(DataContext);
    const [name, setName] = useState(systemConfig.companyName);
    const [logo, setLogo] = useState(systemConfig.logoUrl);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        setName(systemConfig.companyName);
        setLogo(systemConfig.logoUrl);
    }, [systemConfig]);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            await updateSystemConfig({ companyName: name, logoUrl: logo });
            setMessage('Configurações salvas com sucesso!');
            setTimeout(() => setMessage(null), 3000);
        } catch (error: any) {
            setMessage('Erro ao salvar: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Nome da Empresa</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 focus:ring-sky-500 focus:border-sky-500"
                            placeholder="Ex: Minha Transportadora"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">URL do Logo (Imagem)</label>
                        <input 
                            type="text" 
                            value={logo} 
                            onChange={(e) => setLogo(e.target.value)}
                            className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 focus:ring-sky-500 focus:border-sky-500"
                            placeholder="https://exemplo.com/logo.png"
                        />
                        <p className="text-xs text-slate-500 mt-1">Recomendado: Imagem PNG, quadrada.</p>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition duration-200 flex items-center"
                    >
                        {isSaving ? <SpinnerIcon className="w-5 h-5 mr-2"/> : <CheckCircleIcon className="w-5 h-5 mr-2" />}
                        {isSaving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                    {message && (
                        <p className={`text-sm font-bold ${message.includes('Erro') ? 'text-red-400' : 'text-green-400'}`}>
                            {message}
                        </p>
                    )}
                </div>

                {/* Preview Area */}
                <div className="bg-slate-900 rounded-lg p-6 flex flex-col items-center justify-center border border-slate-700">
                    <p className="text-xs text-slate-500 mb-4 uppercase tracking-wider">Pré-visualização do Menu</p>
                    <div className="bg-slate-800/30 w-full p-6 rounded-md border border-slate-700 flex flex-col items-center">
                         {logo ? (
                            <img 
                                src={logo} 
                                alt="Logo Preview" 
                                className="h-24 w-24 rounded-full object-cover border-2 border-sky-500/30 shadow-lg shadow-sky-500/20 mb-4 bg-slate-900" 
                                onError={(e) => (e.currentTarget.style.display = 'none')} 
                            />
                        ) : (
                             <div className="h-24 w-24 bg-slate-700 rounded-full flex items-center justify-center mb-4 border-2 border-sky-500/30">
                                <CogIcon className="h-12 w-12 text-slate-500"/>
                             </div>
                        )}
                        {name && <span className="text-white font-bold text-center text-lg tracking-wide">{name}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Componente de Controle de Sistema (Mock/API) ---
const SystemControl: React.FC = () => {
    const currentMode = getCurrentMode();
    const isMock = currentMode === 'MOCK';

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
            <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-900/50 p-4 rounded-md border border-slate-700">
                <div className="mb-4 sm:mb-0">
                    <p className="text-sm text-slate-300">Modo Atual:</p>
                    <p className={`text-xl font-bold ${isMock ? 'text-yellow-400' : 'text-green-400'}`}>
                        {isMock ? 'MOCK (Dados Falsos)' : 'API REAL (Produção)'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                        {isMock 
                            ? 'O sistema está usando dados locais simulados. Nenhuma alteração será salva no banco real.' 
                            : 'O sistema está conectado ao servidor. Todas as alterações são permanentes.'}
                    </p>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => toggleMode('API')}
                        disabled={!isMock}
                        className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${!isMock ? 'bg-green-900/30 text-green-600 cursor-default border border-green-900/50' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                    >
                        Usar API Real
                    </button>
                    <button 
                         onClick={() => toggleMode('MOCK')}
                         disabled={isMock}
                         className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${isMock ? 'bg-yellow-900/30 text-yellow-600 cursor-default border border-yellow-900/50' : 'bg-yellow-600 hover:bg-yellow-500 text-white'}`}
                    >
                        Usar Dados Mock
                    </button>
                </div>
            </div>
        </div>
    );
};

export const AdminPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'branding' | 'system' | 'license'>('users');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Administração</h2>
                <p className="text-slate-400">Painel central para gestão de usuários, licenças e configurações.</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 border-b border-slate-700 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center whitespace-nowrap ${
                        activeTab === 'users'
                            ? 'bg-slate-800 text-sky-400 border-t border-l border-r border-slate-700'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                    <UserGroupIcon className="w-5 h-5 mr-2" />
                    Usuários
                </button>
                <button
                    onClick={() => setActiveTab('license')}
                    className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center whitespace-nowrap ${
                        activeTab === 'license'
                            ? 'bg-slate-800 text-sky-400 border-t border-l border-r border-slate-700'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                    <DocumentReportIcon className="w-5 h-5 mr-2" />
                    Licença
                </button>
                <button
                    onClick={() => setActiveTab('branding')}
                    className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center whitespace-nowrap ${
                        activeTab === 'branding'
                            ? 'bg-slate-800 text-sky-400 border-t border-l border-r border-slate-700'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                    <PhotographIcon className="w-5 h-5 mr-2" />
                    Identidade Visual
                </button>
                <button
                    onClick={() => setActiveTab('system')}
                    className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center whitespace-nowrap ${
                        activeTab === 'system'
                            ? 'bg-slate-800 text-sky-400 border-t border-l border-r border-slate-700'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                    <CogIcon className="w-5 h-5 mr-2" />
                    Sistema
                </button>
            </div>

            {/* Content Area */}
            <div>
                {activeTab === 'users' && <GestaoUsuarios embedded={true} />}
                {activeTab === 'license' && <LicenseControl />}
                {activeTab === 'branding' && <SystemBranding />}
                {activeTab === 'system' && <SystemControl />}
            </div>
        </div>
    );
};
