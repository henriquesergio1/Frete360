import { Veiculo, Carga, ParametroValor, ParametroTaxa, MotivoSubstituicao, Lancamento, NewLancamento } from '../types';
import { API_MODE, API_URL } from '../api.config';
import * as mockApi from '../api/mockData';

// Declare PapaParse which is loaded from a CDN in index.html
declare const Papa: any;

// --- API REAL (usada quando API_MODE = 'api') ---

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Erro HTTP ${response.status}`);
    }
    if (response.status === 204) return;
    return response.json();
};

const apiRequest = async (url: string, method: 'POST' | 'PUT' | 'DELETE', body?: any) => {
    const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    };
    const response = await fetch(url, options);
    return handleResponse(response);
};

// --- Funções de Leitura (GET) ---

export const getVeiculos = (): Promise<Veiculo[]> => {
    if (API_MODE === 'mock') return mockApi.getMockVeiculos();
    return fetch(`${API_URL}/veiculos`).then(handleResponse);
};

// FIX: Update getCargas to accept parameters for filtering by vehicle and date. This resolves type errors in LancamentoFrete.tsx.
export const getCargas = async (params?: { veiculoCod?: string, data?: string }): Promise<Carga[]> => {
    if (API_MODE === 'mock') return mockApi.getMockCargas(params);
    
    let sIni: string;
    let sFim: string;

    if (params?.data) {
        sIni = params.data;
        sFim = params.data;
    } else {
        const hoje = new Date();
        const trintaDiasAtras = new Date(new Date().setDate(hoje.getDate() - 30));
        sFim = hoje.toISOString().split('T')[0];
        sIni = trintaDiasAtras.toISOString().split('T')[0];
    }

    const erpPromise = fetch(`${API_URL}/cargas-erp?sIni=${sIni}&sFim=${sFim}`).then(handleResponse);
    const manualPromise = fetch(`${API_URL}/cargas-manuais`).then(handleResponse);

    const [erpCargas, manualCargas] = await Promise.all([erpPromise, manualPromise]);
    let allCargas = [...erpCargas, ...manualCargas];

    if (params?.data) {
        // erpPromise is already filtered by date. manualPromise is not, so we filter it here.
        const filteredManualCargas = manualCargas.filter((c: Carga) => c.DataCTE === params.data);
        allCargas = [...erpCargas, ...filteredManualCargas];
    }

    if (params?.veiculoCod) {
        allCargas = allCargas.filter(c => c.COD_VEICULO === params.veiculoCod);
    }
    
    return allCargas;
};

export const getCargasManuais = (): Promise<Carga[]> => {
    if (API_MODE === 'mock') return mockApi.getMockCargasManuais();
    return fetch(`${API_URL}/cargas-manuais`).then(handleResponse);
};

export const getParametrosValores = (): Promise<ParametroValor[]> => {
    if (API_MODE === 'mock') return mockApi.getMockParametrosValores();
    return fetch(`${API_URL}/parametros-valores`).then(handleResponse);
};

export const getParametrosTaxas = (): Promise<ParametroTaxa[]> => {
    if (API_MODE === 'mock') return mockApi.getMockParametrosTaxas();
    return fetch(`${API_URL}/parametros-taxas`).then(handleResponse);
};

export const getMotivosSubstituicao = (): Promise<MotivoSubstituicao[]> => {
    // Mantendo mockado pois não há uma tabela no banco para isso
    return mockApi.getMockMotivosSubstituicao();
};

export const getLancamentos = (): Promise<Lancamento[]> => {
    if (API_MODE === 'mock') return mockApi.getMockLancamentos();
    return fetch(`${API_URL}/lancamentos`).then(handleResponse);
};


// --- Funções de Escrita (POST, PUT, DELETE) ---

// Lançamentos
export const createLancamento = (lancamento: NewLancamento): Promise<Lancamento> => {
    if (API_MODE === 'mock') throw new Error("Função não implementada em modo mock.");
    return apiRequest(`${API_URL}/lancamentos`, 'POST', lancamento);
};

export const deleteLancamento = (id: number, motivo: string): Promise<void> => {
    if (API_MODE === 'mock') throw new Error("Função não implementada em modo mock.");
    return apiRequest(`${API_URL}/lancamentos/${id}`, 'PUT', { motivo }); // PUT para exclusão lógica
};

// Veículos
export const createVeiculo = (veiculo: Omit<Veiculo, 'ID_Veiculo'>): Promise<Veiculo> => {
    if (API_MODE === 'mock') throw new Error("Função não implementada em modo mock.");
    return apiRequest(`${API_URL}/veiculos`, 'POST', veiculo);
};

export const updateVeiculo = (id: number, veiculo: Veiculo): Promise<Veiculo> => {
    if (API_MODE === 'mock') throw new Error("Função não implementada em modo mock.");
    return apiRequest(`${API_URL}/veiculos/${id}`, 'PUT', veiculo);
};

// Cargas Manuais
export const createCarga = (carga: Omit<Carga, 'ID_Carga'>): Promise<Carga> => {
    if (API_MODE === 'mock') throw new Error("Função não implementada em modo mock.");
    return apiRequest(`${API_URL}/cargas-manuais`, 'POST', carga);
};

export const updateCarga = (id: number, carga: Carga): Promise<Carga> => {
    if (API_MODE === 'mock') throw new Error("Função não implementada em modo mock.");
    return apiRequest(`${API_URL}/cargas-manuais/${id}`, 'PUT', carga);
};

export const deleteCarga = (id: number, motivo: string): Promise<void> => {
    if (API_MODE === 'mock') throw new Error("Função não implementada em modo mock.");
    // A API espera um corpo com o status de exclusão e o motivo
    const body = { Excluido: true, MotivoExclusao: motivo };
    return apiRequest(`${API_URL}/cargas-manuais/${id}`, 'PUT', body);
};

// Parâmetros de Valor
export const createParametroValor = (param: Omit<ParametroValor, 'ID_Parametro'>): Promise<ParametroValor> => {
    if (API_MODE === 'mock') throw new Error("Função não implementada em modo mock.");
    return apiRequest(`${API_URL}/parametros-valores`, 'POST', param);
};
export const updateParametroValor = (id: number, param: ParametroValor): Promise<ParametroValor> => {
    if (API_MODE === 'mock') throw new Error("Função não implementada em modo mock.");
    return apiRequest(`${API_URL}/parametros-valores/${id}`, 'PUT', param);
};
export const deleteParametroValor = (id: number): Promise<void> => {
    if (API_MODE === 'mock') throw new Error("Função não implementada em modo mock.");
    return apiRequest(`${API_URL}/parametros-valores/${id}`, 'DELETE');
};

// Parâmetros de Taxa
export const createParametroTaxa = (param: Omit<ParametroTaxa, 'ID_Taxa'>): Promise<ParametroTaxa> => {
    if (API_MODE === 'mock') throw new Error("Função não implementada em modo mock.");
    return apiRequest(`${API_URL}/parametros-taxas`, 'POST', param);
};
export const updateParametroTaxa = (id: number, param: ParametroTaxa): Promise<ParametroTaxa> => {
    if (API_MODE === 'mock') throw new Error("Função não implementada em modo mock.");
    return apiRequest(`${API_URL}/parametros-taxas/${id}`, 'PUT', param);
};
export const deleteParametroTaxa = (id: number): Promise<void> => {
    if (API_MODE === 'mock') throw new Error("Função não implementada em modo mock.");
    return apiRequest(`${API_URL}/parametros-taxas/${id}`, 'DELETE');
};

// --- Importação ---
export const importData = async (file: File, type: 'veiculos' | 'cargas' | 'parametros-valores' | 'parametros-taxas'): Promise<{ message: string; count: number }> => {
    // TODO: A importação real deve fazer upload do arquivo para a API.
    // Manteremos a lógica de parse no frontend por enquanto, que funcionará no modo mock.
    if (API_MODE === 'api') {
        alert("A importação via API ainda não foi implementada. Os dados não serão salvos.");
    }

    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results: { data: any[] }) => {
                console.log(`Dados para importar para '${type}':`, results.data);
                // No modo mock, isso não faz nada. No modo API, deveria enviar `results.data` para um endpoint de lote.
                resolve({ message: `Arquivo processado.`, count: results.data.length });
            },
            error: (error: any) => reject(new Error('Erro ao ler o arquivo CSV: ' + error.message))
        });
    });
};