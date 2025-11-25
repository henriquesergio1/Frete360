





import React, { useState, useContext, useEffect } from 'react';
import { LancamentoFrete } from './components/LancamentoFrete.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { Relatorios } from './components/Relatorios.tsx';
import { Importacao } from './components/Importacao.tsx';
import { GestaoVeiculos } from './components/GestaoVeiculos.tsx';
import { GestaoParametros } from './components/GestaoParametros.tsx';
import { GestaoCargas } from './components/GestaoCargas.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { Login } from './components/Login.tsx';
import { DataProvider, DataContext } from './context/DataContext.tsx';
import { AuthProvider, AuthContext, useAuth } from './context/AuthContext.tsx';
import { ChartBarIcon, CogIcon, PlusCircleIcon, TruckIcon, DocumentReportIcon, CloudUploadIcon, BoxIcon, SpinnerIcon, XCircleIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, Frete360Logo, AdjustmentsIcon, ExclamationIcon, CheckCircleIcon } from './components/icons.tsx';
import { updateLicense, getSystemStatus } from './services/apiService.ts';
import { LicenseStatus } from './types.ts';

type View = 'dashboard' | 'lancamento' | 'veiculos' | 'cargas' | 'parametros' | 'relatorios' | 'importacao' | 'admin';

interface SidebarProps {
    activeView: View;
    setView: (view: View) => void;
    isCollapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    licenseStatus: LicenseStatus | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setView, isCollapsed, setCollapsed, licenseStatus }) => {
    const { systemConfig } = useContext(DataContext);
    const { user, logout } = useAuth();
    
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
        { id: 'lancamento', label: 'Novo Lançamento', icon: PlusCircleIcon },
        { id: 'veiculos', label: 'Veículos', icon: TruckIcon },
        { id: 'cargas', label: 'Cargas', icon: BoxIcon },
        { id: 'relatorios', label: 'Relatórios', icon: DocumentReportIcon },
        { id: 'importacao', label: 'Importação', icon: CloudUploadIcon },
        { id: 'parametros', label: 'Parâmetros', icon: AdjustmentsIcon },
    ];

    // Adiciona Menu Admin se for Admin
    if (user?.Perfil === 'Admin') {
        // @ts-ignore
        navItems.push({ id: 'admin', label: 'Administração', icon: CogIcon });
    }

    // Lógica de Alerta de Licença
    const renderLicenseAlert = () => {
        if (!licenseStatus || !licenseStatus.expiresAt) return null;

        const today = new Date();
        const expireDate = new Date(licenseStatus.expiresAt);
        const diffTime = expireDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Se faltar mais de 15 dias, não mostra nada
        if (diffDays > 15) return null;

        let colorClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
        let text = `Vence em ${diffDays} dias`;
        let icon = <ExclamationIcon className="w-3 h-3 mr-1" />;

        if (diffDays <= 5) {
            colorClass = 'bg-red-500/20 text-red-400 border-red-500/30';
        }
        
        if (diffDays < 0) {
            text = "Licença Expirada";
            colorClass = 'bg-red-600 text-white border-red-700';
        }

        if (isCollapsed) {
            return (
                <div className={`mt-2 w-6 h-6 rounded-full flex items-center justify-center ${diffDays < 0 ? 'bg-red-600 text-white' : 'bg-yellow-500 text-slate-900'} animate-pulse`} title={text}>
                    <span className="text-[10px] font-bold">!</span>
                </div>
            );
        }

        return (
            <div 
                className={`mt-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide border flex items-center justify-center w-full animate-pulse cursor-help ${colorClass}`}
                title="Renove sua licença no menu Administração"
                onClick={() => setView('admin')}
            >
                {icon}
                {text}
            </div>
        );
    };

    return (
        <div className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            
            {/* Header Principal do Sistema (Frete360) */}
            <div className={`flex items-center justify-center py-3 border-b border-slate-800 bg-slate-900 ${isCollapsed ? 'px-1' : 'px-4'}`}>
                <Frete360Logo className={`text-sky-500 transition-all duration-300 ${isCollapsed ? 'h-8 w-8' : 'h-8 w-8 mr-2'}`} />
                <h1 className={`text-xl font-extrabold text-white tracking-tight transition-all duration-200 ${isCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                    Frete<span className="text-sky-500">360</span>
                </h1>
            </div>

            {/* Header da Empresa Cliente (Dinâmico) */}
            <div className={`flex flex-col items-center justify-center border-b border-slate-800 transition-all duration-500 py-4 bg-slate-800/30 ${isCollapsed ? 'px-2' : 'px-4'}`}>
                {systemConfig.logoUrl ? (
                    <>
                        <img 
                            src={systemConfig.logoUrl} 
                            alt="Logo" 
                            className={`transition-all duration-500 rounded-full object-cover border-2 border-sky-500/30 bg-slate-900 shadow-lg shadow-sky-500/10 ${isCollapsed ? 'h-10 w-10' : 'h-24 w-24 mb-2'}`} 
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                         <h2 className={`text-sm font-bold text-white text-center tracking-wide transition-all duration-200 ${isCollapsed ? 'opacity-0 h-0 overflow-hidden mt-0' : 'opacity-100'}`}>
                            {systemConfig.companyName}
                        </h2>
                    </>
                ) : (
                    <h2 className={`text-sm font-bold text-slate-300 text-center transition-all duration-200 ${isCollapsed ? 'text-[10px]' : ''}`}>
                        {systemConfig.companyName || 'Empresa'}
                    </h2>
                )}
                {/* Alerta de Licença */}
                {renderLicenseAlert()}
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setView(item.id as View)}
                        title={isCollapsed ? item.label : undefined}
                        className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isCollapsed ? 'justify-center' : ''} ${
                            activeView === item.id 
                                ? 'bg-sky-500 text-white' 
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                    >
                        <item.icon className="h-5 w-5 shrink-0" />
                        <span className={`ml-3 transition-opacity whitespace-nowrap ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>{item.label}</span>
                    </button>
                ))}
            </nav>
            
            {/* User Info & Footer */}
            <div className="border-t border-slate-800 p-3 bg-slate-900/50">
                <div className={`flex flex-col mb-2 ${isCollapsed ? 'items-center' : ''}`}>
                     <div className={`flex items-center mb-1 ${isCollapsed ? 'justify-center' : ''}`}>
                        <div className="w-8 h-8 rounded-full bg-sky-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {user?.Nome.charAt(0).toUpperCase()}
                        </div>
                        <div className={`ml-3 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                            <p className="text-sm font-medium text-white truncate">{user?.Nome}</p>
                            <p className="text-xs text-slate-400 truncate">{user?.Perfil}</p>
                        </div>
                     </div>
                     <button 
                        onClick={logout}
                        className="text-xs text-red-400 hover:text-red-300 font-bold transition-colors"
                     >
                         {isCollapsed ? 'SAIR' : 'Sair do Sistema'}
                     </button>
                </div>

                <div className={`flex flex-col ${isCollapsed ? 'items-center' : ''}`}>
                    <p className="text-xs font-mono text-slate-500" title="Versão do Sistema">v1.2.42</p>
                    <div className={`transition-all duration-300 overflow-hidden ${isCollapsed ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}>
                        <p className="text-[10px] text-slate-600 uppercase tracking-wider">Dev</p>
                        <p className="text-xs text-slate-400 font-medium whitespace-nowrap">Sérgio Oliveira</p>
                    </div>
                </div>
            </div>

            <div className={`p-2 border-t border-slate-800 transition-all duration-300 bg-slate-900`}>
                <button 
                    onClick={() => setCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center py-1.5 text-sm font-medium rounded text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors duration-200"
                    title={isCollapsed ? "Expandir menu" : "Recolher menu"}
                >
                    {isCollapsed ? <ChevronDoubleRightIcon className="h-4 w-4"/> : <ChevronDoubleLeftIcon className="h-4 w-4"/>}
                </button>
            </div>
        </div>
    );
};

const MainLayout: React.FC = () => {
    const { loading, error, systemConfig } = useContext(DataContext);
    const { user, logout } = useAuth(); 
    const [activeView, setActiveView] = useState<View>('dashboard');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [readOnlyMode, setReadOnlyMode] = useState(false);
    const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);

    // Estados para ativação de emergência na tela de erro
    const [licenseKeyInput, setLicenseKeyInput] = useState('');
    const [activating, setActivating] = useState(false);
    const [activationMsg, setActivationMsg] = useState('');

    const handleEmergencyActivation = async () => {
        if (!licenseKeyInput.trim()) return;
        setActivating(true);
        setActivationMsg('');
        try {
            await updateLicense(licenseKeyInput);
            setActivationMsg('Licença ativada com sucesso! Reiniciando...');
            setTimeout(() => window.location.reload(), 2000);
        } catch (e: any) {
            setActivationMsg('Erro: ' + (e.message || 'Falha na ativação'));
            setActivating(false);
        }
    };

    // Atualiza o título da página e o Favicon dinamicamente
    useEffect(() => {
        const company = systemConfig.companyName || 'Gestão de Fretes';
        document.title = `Frete360 | ${company}`;

        // Lógica para Favicon Dinâmico
        const updateFavicon = (url: string) => {
            // Remove favicons antigos para forçar atualização
            const links = document.querySelectorAll("link[rel*='icon']");
            links.forEach(l => l.parentNode?.removeChild(l));

            // Cria novo elemento link
            const link = document.createElement('link');
            link.type = 'image/x-icon';
            link.rel = 'shortcut icon';
            link.href = url;
            document.getElementsByTagName('head')[0].appendChild(link);
        };

        // Se tiver URL do cliente usa ela, senão usa o padrão com cache busting
        if (systemConfig.logoUrl) {
            updateFavicon(systemConfig.logoUrl);
        } else {
            updateFavicon('/favicon.svg?v=' + new Date().getTime());
        }

    }, [systemConfig]);

    // Carrega status da licença para o Sidebar
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const status = await getSystemStatus();
                setLicenseStatus(status);
                if (status.status === 'EXPIRED') setReadOnlyMode(true);
            } catch (e) {
                console.error("Erro ao verificar status da licença no MainLayout:", e);
            }
        };
        checkStatus();
    }, []);

    // Escuta evento de licença expirada vindo da API (redundância para requisições falhas)
    useEffect(() => {
        const handleLicenseExpired = () => {
            setReadOnlyMode(true);
            // Opcional: Recarregar status para atualizar contadores
            getSystemStatus().then(setLicenseStatus).catch(console.error);
        };
        window.addEventListener('FRETE360_LICENSE_EXPIRED', handleLicenseExpired);
        return () => window.removeEventListener('FRETE360_LICENSE_EXPIRED', handleLicenseExpired);
    }, []);

    const renderContent = () => {
        // Proteção extra: se tentar acessar admin sem ser admin, volta pro dashboard
        if (activeView === 'admin' && user?.Perfil !== 'Admin') {
            setActiveView('dashboard');
            return <Dashboard />;
        }

        switch (activeView) {
            case 'lancamento': return <LancamentoFrete setView={setActiveView} />;
            case 'importacao': return <Importacao />;
            case 'dashboard': return <Dashboard />;
            case 'veiculos': return <GestaoVeiculos />;
            case 'cargas': return <GestaoCargas />;
            case 'relatorios': return <Relatorios setView={setActiveView} />;
            case 'parametros': return <GestaoParametros />;
            case 'admin': return <AdminPanel />;
            default: return <Dashboard />;
        }
    };
    
    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-900">
                <div className="flex flex-col items-center text-slate-400">
                    <SpinnerIcon className="w-12 h-12 text-sky-500" />
                    <p className="mt-4 text-lg">Carregando dados...</p>
                </div>
            </div>
        );
    }

    if (error) {
         // Se o erro for de licença ausente (bloqueio total), mostra tela especifica com opção de SAIR e ATIVAR se for Admin
         // Verifica se o erro contem a string tecnica OU a mensagem legivel
         const isLicenseError = 
            error.includes('LICENSE_MISSING') || 
            error.includes('LICENSE_INVALID') || 
            error.includes('Licença não encontrada') ||
            error.includes('Licença inválida');

         if (isLicenseError) {
             return (
                <div className="flex h-screen w-full items-center justify-center bg-slate-900 p-4">
                    <div className="flex flex-col items-center text-center max-w-lg w-full p-8 bg-slate-800 rounded-lg border border-red-700/50 shadow-2xl">
                        <ExclamationIcon className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold text-white">Acesso Bloqueado</h2>
                        <p className="mt-2 text-slate-300">Este sistema não possui uma licença válida ativa.</p>
                        
                        {user?.Perfil === 'Admin' ? (
                            <div className="w-full mt-6 bg-slate-900/50 p-4 rounded border border-slate-600">
                                <p className="text-sm text-sky-400 mb-2 font-bold text-left">Ativação de Emergência (Administrador)</p>
                                <textarea 
                                    value={licenseKeyInput}
                                    onChange={e => setLicenseKeyInput(e.target.value)}
                                    className="w-full bg-slate-800 text-white text-xs p-3 rounded border border-slate-600 mb-3 focus:ring-sky-500 focus:border-sky-500"
                                    placeholder="Cole a chave de licença aqui..."
                                    rows={3}
                                />
                                <button 
                                    onClick={handleEmergencyActivation}
                                    disabled={activating || !licenseKeyInput}
                                    className="w-full bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 rounded flex justify-center items-center transition-colors"
                                >
                                    {activating ? <SpinnerIcon className="w-4 h-4 mr-2"/> : <CheckCircleIcon className="w-4 h-4 mr-2"/>}
                                    {activating ? 'Validando...' : 'Ativar Sistema'}
                                </button>
                                {activationMsg && (
                                    <p className={`text-xs mt-2 font-bold ${activationMsg.includes('Erro') ? 'text-red-400' : 'text-green-400'}`}>
                                        {activationMsg}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-slate-400">Contate o administrador do sistema.</p>
                        )}
                        
                        <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <button onClick={() => window.location.reload()} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-md">
                                Tentar Novamente
                            </button>
                            <button onClick={logout} className="bg-red-600/20 hover:bg-red-600/40 text-red-300 font-bold py-2 px-6 rounded-md border border-red-600/30">
                                Sair / Trocar Usuário
                            </button>
                        </div>
                    </div>
                </div>
             );
         }

         return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-900 p-4">
                <div className="flex flex-col items-center text-center max-w-lg p-8 bg-slate-800 rounded-lg border border-red-700/50">
                    <XCircleIcon className="w-12 h-12 text-red-500" />
                    <h2 className="mt-4 text-xl font-bold text-white">Erro de Conexão</h2>
                    <p className="mt-2 text-slate-400">Não foi possível carregar os dados do sistema. Verifique se o serviço de backend está em execução e se o Banco de Dados está atualizado.</p>
                    <p className="mt-4 text-xs text-slate-500 bg-slate-900 p-2 rounded-md font-mono text-left w-full overflow-auto max-h-32">{error}</p>
                    
                    <div className="mt-6 flex gap-4">
                        <button onClick={() => window.location.reload()} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md">
                            Recarregar
                        </button>
                         <button onClick={logout} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md">
                            Sair do Sistema
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-800 text-slate-100">
            {readOnlyMode && (
                <div className="bg-orange-600 text-white text-center text-xs font-bold py-1 px-4 flex justify-center items-center shadow-md z-50">
                    <ExclamationIcon className="w-4 h-4 mr-2" />
                    MODO SOMENTE LEITURA - LICENÇA EXPIRADA - CONTATE O SUPORTE
                </div>
            )}
            <div className="flex flex-1 overflow-hidden">
                <Sidebar 
                    activeView={activeView} 
                    setView={setActiveView} 
                    isCollapsed={isSidebarCollapsed} 
                    setCollapsed={setIsSidebarCollapsed}
                    licenseStatus={licenseStatus}
                />
                <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto bg-slate-800 relative">
                    <div className="max-w-7xl mx-auto">
                       {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const { isAuthenticated, loading: authLoading, user } = useAuth();

    if (authLoading) {
        return <div className="flex h-screen items-center justify-center bg-slate-900 text-white"><SpinnerIcon className="w-10 h-10" /></div>;
    }

    if (!isAuthenticated) {
        return <Login />;
    }

    return (
        <DataProvider key={user?.ID_Usuario}>
            <MainLayout />
        </DataProvider>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
