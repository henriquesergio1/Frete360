
import { Veiculo, Carga, ParametroValor, ParametroTaxa, MotivoSubstituicao, Lancamento, NewLancamento, VehicleCheckResult, VehicleConflict, CargaCheckResult, CargaReactivation, Usuario, AuthResponse, LicenseStatus, SystemConfig } from '../types.ts';
import * as mockApi from '../api/mockData.ts';
import Papa from 'papaparse';

// =============================================================================
// CONFIGURAÇÃO DE MODO
// =============================================================================
declare global { interface Window { __FRETE_MODO_MOCK__?: boolean; } }

const getStoredMode = (): boolean | null => {
    try {
        const stored = localStorage.getItem('APP_MODE');
        if (stored === 'MOCK') return true;
        if (stored === 'API') return false;
    } catch (e) { console.warn('[API SETUP] LocalStorage inacessível:', e); }
    return null;
};

const getHtmlConfig = (): boolean => {
    if (typeof window !== 'undefined' && window.__FRETE_MODO_MOCK__ !== undefined) {
        return window.__FRETE_MODO_MOCK__;
    }
    return false;
};

const USE_MOCK = getStoredMode() ?? getHtmlConfig();
const API_BASE_URL = '/api';

console.log(`[API SERVICE] MODO ATIVO: ${USE_MOCK ? 'MOCK' : 'API REAL'}`);

export const toggleMode = (mode: 'MOCK' | 'API') => {
    localStorage.setItem('APP_MODE', mode);
    window.location.reload();
};
export const getCurrentMode = () => USE_MOCK ? 'MOCK' : 'API';

// =============================================================================
// UTILITÁRIOS API REAL
// =============================================================================

const getToken = () => localStorage.getItem('AUTH_TOKEN');

const handleResponse = async (response: Response, isLoginRequest: boolean = false) => {
    // 401: Não autorizado / 403: Proibido
    if (response.status === 401 || response.status === 403) {
        if (isLoginRequest) {
            let errorMessage = 'Falha na autenticação.';
            try {
                const errorData = await response.json();
                if (errorData && errorData.message) errorMessage = errorData.message;
            } catch (e) {}
            throw new Error(errorMessage);
        }

        console.warn(`[API] Erro de Autenticação (${response.status}). Limpando sessão e recarregando.`);
        localStorage.removeItem('AUTH_TOKEN');
        localStorage.removeItem('AUTH_USER');
        window.location.reload();
        throw new Error('Sessão expirada ou inválida. Por favor, faça login novamente.');
    }

    // 402: Payment Required (Licença Expirada / Read Only / Missing)
    if (response.status === 402) {
        const errorData = await response.json();
        // Importante: Incluir o código do erro na mensagem para que o App.tsx possa detectar
        const codeTag = errorData.code ? `[${errorData.code}] ` : '';
        throw new Error(`${codeTag}${errorData.message || 'Modo Somente Leitura. Licença Expirada.'}`);
    }
    
    if (!response.ok) {
        let errorMessage = response.statusText;
        try {
            const errorData = await response.json();
            if (errorData && errorData.message) errorMessage = errorData.message;
        } catch (e) {}
        throw new Error(`Erro na API (${response.status}): ${errorMessage}`);
    }
    
    if (response.status === 204) return null;
    
    try {
        return await response.json();
    } catch (e) {
        console.error('[API] Erro ao processar JSON:', e);
        throw new Error('Resposta inválida do servidor (JSON malformado).');
    }
};

const apiRequest = async (endpoint: string, method: 'POST' | 'PUT' | 'DELETE', body?: any) => {
    const cleanUrl = API_BASE_URL.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    const url = `${cleanUrl}/${cleanEndpoint}`;
    
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options: RequestInit = { 
        method, 
        headers, 
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store' 
    };
    
    try {
        const response = await fetch(url, options);
        const isLogin = cleanEndpoint === 'login';
        return handleResponse(response, isLogin);
    } catch (error: any) {
        console.error(`[API ERROR] Falha ao conectar em ${url}:`, error);
        throw error; 
    }
};

const apiGet = async (endpoint: string) => {
    const cleanUrl = API_BASE_URL.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    
    const cacheBuster = `_t=${new Date().getTime()}`;
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${cleanUrl}/${cleanEndpoint}${separator}${cacheBuster}`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    };
    
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const response = await fetch(url, { headers, cache: 'no-store' });
        const data = await handleResponse(response, false);
        
        // Verifica se o header de status da licença veio expirado (Modo Leitura)
        const licenseStatus = response.headers.get('X-License-Status');
        if (licenseStatus === 'EXPIRED') {
            // Dispara um evento customizado para o App.tsx capturar e mostrar o banner
            window.dispatchEvent(new CustomEvent('FRETE360_LICENSE_EXPIRED'));
        }

        return data;
    } catch (error: any) {
        console.error(`[API ERROR] Falha ao buscar dados de ${url}:`, error);
        throw error;
    }
};

// =============================================================================
// IMPLEMENTAÇÃO DA API REAL
// =============================================================================

const RealService = {
    // Sistema & Licença
    getSystemStatus: (): Promise<LicenseStatus> => apiGet('/system/status'),
    updateLicense: (licenseKey: string): Promise<any> => apiRequest('/license', 'POST', { licenseKey }),
    
    // Configuração (Identidade Visual)
    getSystemConfig: (): Promise<SystemConfig> => apiGet('/system/config'),
    updateSystemConfig: (config: SystemConfig): Promise<any> => apiRequest('/system/config', 'PUT', config),

    // Autenticação & Usuários
    login: (usuario: string, senha: string): Promise<AuthResponse> => apiRequest('/login', 'POST', { usuario, senha }),
    getUsuarios: (): Promise<Usuario[]> => apiGet('/usuarios'),
    createUsuario: (u: any): Promise<Usuario> => apiRequest('/usuarios', 'POST', u),
    updateUsuario: (id: number, u: any): Promise<Usuario> => apiRequest(`/usuarios/${id}`, 'PUT', u),

    // Dados Básicos
    getVeiculos: (): Promise<Veiculo[]> => apiGet('/veiculos'),
    getCargas: async (params?: { veiculoCod?: string, data?: string }): Promise<Carga[]> => {
        let cargas: Carga[] = await apiGet('/cargas-manuais') || [];
        if (params) {
            if (params.data) {
                cargas = cargas.filter(c => {
                    if (!c.DataCTE) return false;
                    const dbDate = String(c.DataCTE).split('T')[0];
                    return dbDate === params.data;
                });
            }
            if (params.veiculoCod) {
                const targetCod = String(params.veiculoCod).trim().toUpperCase();
                cargas = cargas.filter(c => String(c.COD_Veiculo).trim().toUpperCase() === targetCod); 
            }
        }
        return cargas.filter(c => !c.Excluido);
    },
    getCargasManuais: (): Promise<Carga[]> => apiGet('/cargas-manuais'),
    getParametrosValores: (): Promise<ParametroValor[]> => apiGet('/parametros-valores'),
    getParametrosTaxas: (): Promise<ParametroTaxa[]> => apiGet('/parametros-taxas'),
    getMotivosSubstituicao: (): Promise<MotivoSubstituicao[]> => apiGet('/motivos-substituicao'),
    getLancamentos: (): Promise<Lancamento[]> => apiGet('/lancamentos'),

    // Escrita (Protegida)
    createLancamento: (l: NewLancamento): Promise<Lancamento> => apiRequest('/lancamentos', 'POST', l),
    deleteLancamento: (id: number, motivo: string): Promise<void> => apiRequest(`/lancamentos/${id}`, 'PUT', { motivo }),
    
    createVeiculo: (v: Omit<Veiculo, 'ID_Veiculo'>): Promise<Veiculo> => apiRequest('/veiculos', 'POST', v),
    updateVeiculo: (id: number, v: Veiculo): Promise<Veiculo> => apiRequest(`/veiculos/${id}`, 'PUT', v),
    
    createCarga: (c: Omit<Carga, 'ID_Carga'>): Promise<Carga> => apiRequest('/cargas-manuais', 'POST', c),
    updateCarga: (id: number, c: Carga): Promise<Carga> => apiRequest(`/cargas-manuais/${id}`, 'PUT', c),
    deleteCarga: (id: number, motivo: string): Promise<void> => apiRequest(`/cargas-manuais/${id}`, 'PUT', { Excluido: true, MotivoExclusao: motivo }),
    
    createParametroValor: (p: Omit<ParametroValor, 'ID_Parametro'>): Promise<ParametroValor> => apiRequest('/parametros-valores', 'POST', p),
    updateParametroValor: (id: number, p: ParametroValor): Promise<ParametroValor> => apiRequest(`/parametros-valores/${id}`, 'PUT', p),
    deleteParametroValor: (id: number, motivo: string): Promise<void> => apiRequest(`/parametros-valores/${id}`, 'PUT', { Excluido: true, MotivoExclusao: motivo }),
    
    createParametroTaxa: (p: Omit<ParametroTaxa, 'ID_Taxa'>): Promise<ParametroTaxa> => apiRequest('/parametros-taxas', 'POST', p),
    updateParametroTaxa: (id: number, p: ParametroTaxa): Promise<ParametroTaxa> => apiRequest(`/parametros-taxas/${id}`, 'PUT', p),
    deleteParametroTaxa: (id: number, motivo: string): Promise<void> => apiRequest(`/parametros-taxas/${id}`, 'PUT', { Excluido: true, MotivoExclusao: motivo }),
    
    // Importação
    importCargasFromERP: async (sIni: string, sFim: string) => { throw new Error("Deprecated"); },
    checkCargasERP: async (sIni: string, sFim: string): Promise<CargaCheckResult> => apiRequest('/cargas-erp/check', 'POST', { sIni, sFim }),
    syncCargasERP: async (newCargas: Carga[], cargasToReactivate: Carga[]): Promise<{ message: string, count: number }> => apiRequest('/cargas-erp/sync', 'POST', { newCargas, cargasToReactivate }),
    checkVeiculosERP: async (): Promise<VehicleCheckResult> => apiGet('/veiculos-erp/check'),
    syncVeiculosERP: async (newVehicles: Veiculo[], vehiclesToUpdate: Veiculo[]): Promise<{ message: string, count: number }> => apiRequest('/veiculos-erp/sync', 'POST', { newVehicles, vehiclesToUpdate }),
    importData: async (file: File, type: string): Promise<any> => { throw new Error("A importação de CSV ainda não está implementada no backend real."); }
};

// =============================================================================
// IMPLEMENTAÇÃO DA API MOCK
// =============================================================================

const MockService = {
    getSystemStatus: async (): Promise<LicenseStatus> => ({ status: 'ACTIVE', client: 'Mock Client', expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) }),
    updateLicense: async () => ({ success: true, message: 'Licença Mock Ativada' }),
    
    // Mock de configuração mantido em memória/localStorage pelo DataContext, mas aqui retorna padrão
    getSystemConfig: async (): Promise<SystemConfig> => ({ companyName: 'Mock Transportes', logoUrl: '' }),
    updateSystemConfig: async (config: SystemConfig) => ({ success: true, message: 'Config mock salva' }),

    login: mockApi.mockLogin,
    getUsuarios: mockApi.getMockUsuarios,
    createUsuario: mockApi.createMockUsuario,
    updateUsuario: mockApi.updateMockUsuario,

    getVeiculos: mockApi.getMockVeiculos,
    getCargas: mockApi.getMockCargas,
    getCargasManuais: mockApi.getMockCargasManuais,
    getParametrosValores: mockApi.getMockParametrosValores,
    getParametrosTaxas: mockApi.getMockParametrosTaxas,
    getMotivosSubstituicao: mockApi.getMockMotivosSubstituicao,
    getLancamentos: mockApi.getMockLancamentos,
    
    createLancamento: mockApi.createMockLancamento,
    deleteLancamento: mockApi.deleteMockLancamento,
    
    createVeiculo: mockApi.createMockVeiculo,
    updateVeiculo: mockApi.updateMockVeiculo,
    createCarga: mockApi.createMockCarga,
    updateCarga: mockApi.updateMockCarga,
    deleteCarga: mockApi.deleteMockCarga,
    
    createParametroValor: mockApi.createMockParametroValor,
    updateParametroValor: mockApi.updateMockParametroValor,
    deleteParametroValor: mockApi.deleteMockParametroValor,
    createParametroTaxa: mockApi.createMockParametroTaxa,
    updateParametroTaxa: mockApi.updateMockParametroTaxa,
    deleteParametroTaxa: mockApi.deleteMockParametroTaxa,
    
    importCargasFromERP: mockApi.importMockCargasFromERP,
    checkCargasERP: mockApi.checkCargasERP,
    syncCargasERP: mockApi.syncCargasERP,
    checkVeiculosERP: mockApi.checkVeiculosERP,
    syncVeiculosERP: mockApi.syncVeiculosERP,
    importData: mockApi.importData
};

// =============================================================================
// EXPORTAÇÕES
// =============================================================================
export const getSystemStatus = USE_MOCK ? MockService.getSystemStatus : RealService.getSystemStatus;
export const updateLicense = USE_MOCK ? MockService.updateLicense : RealService.updateLicense;
export const getSystemConfig = USE_MOCK ? MockService.getSystemConfig : RealService.getSystemConfig;
export const updateSystemConfig = USE_MOCK ? MockService.updateSystemConfig : RealService.updateSystemConfig;

export const login = USE_MOCK ? MockService.login : RealService.login;
export const getUsuarios = USE_MOCK ? MockService.getUsuarios : RealService.getUsuarios;
export const createUsuario = USE_MOCK ? MockService.createUsuario : RealService.createUsuario;
export const updateUsuario = USE_MOCK ? MockService.updateUsuario : RealService.updateUsuario;

export const getVeiculos = USE_MOCK ? MockService.getVeiculos : RealService.getVeiculos;
export const getCargas = USE_MOCK ? MockService.getCargas : RealService.getCargas;
export const getCargasManuais = USE_MOCK ? MockService.getCargasManuais : RealService.getCargasManuais;
export const getParametrosValores = USE_MOCK ? MockService.getParametrosValores : RealService.getParametrosValores;
export const getParametrosTaxas = USE_MOCK ? MockService.getParametrosTaxas : RealService.getParametrosTaxas;
export const getMotivosSubstituicao = USE_MOCK ? MockService.getMotivosSubstituicao : RealService.getMotivosSubstituicao;
export const getLancamentos = USE_MOCK ? MockService.getLancamentos : RealService.getLancamentos;

export const createLancamento = USE_MOCK ? MockService.createLancamento : RealService.createLancamento;
export const deleteLancamento = USE_MOCK ? MockService.deleteLancamento : RealService.deleteLancamento;

export const createVeiculo = USE_MOCK ? MockService.createVeiculo : RealService.createVeiculo;
export const updateVeiculo = USE_MOCK ? MockService.updateVeiculo : RealService.updateVeiculo;

export const createCarga = USE_MOCK ? MockService.createCarga : RealService.createCarga;
export const updateCarga = USE_MOCK ? MockService.updateCarga : RealService.updateCarga;
export const deleteCarga = USE_MOCK ? MockService.deleteCarga : RealService.deleteCarga;

export const createParametroValor = USE_MOCK ? MockService.createParametroValor : RealService.createParametroValor;
export const updateParametroValor = USE_MOCK ? MockService.updateParametroValor : RealService.updateParametroValor;
export const deleteParametroValor = USE_MOCK ? MockService.deleteParametroValor : RealService.deleteParametroValor;

export const createParametroTaxa = USE_MOCK ? MockService.createParametroTaxa : RealService.createParametroTaxa;
export const updateParametroTaxa = USE_MOCK ? MockService.updateParametroTaxa : RealService.updateParametroTaxa;
export const deleteParametroTaxa = USE_MOCK ? MockService.deleteParametroTaxa : RealService.deleteParametroTaxa;

export const checkCargasERP = USE_MOCK ? MockService.checkCargasERP : RealService.checkCargasERP;
export const syncCargasERP = USE_MOCK ? MockService.syncCargasERP : RealService.syncCargasERP;
export const checkVeiculosERP = USE_MOCK ? MockService.checkVeiculosERP : RealService.checkVeiculosERP;
export const syncVeiculosERP = USE_MOCK ? MockService.syncVeiculosERP : RealService.syncVeiculosERP;
export const importData = USE_MOCK ? MockService.importData : RealService.importData;
