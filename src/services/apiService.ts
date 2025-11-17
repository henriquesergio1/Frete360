import { Veiculo, Carga, ParametroValor, ParametroTaxa, MotivoSubstituicao, Lancamento, NewLancamento } from '../types';
import { API_MODE, API_URL } from '../api.config';

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
    return fetch(`${API_URL}/veiculos`).then(handleResponse);
};

export const getCargas = async (params?: { veiculoCod?: string, data?: string }): Promise<Carga[]> => {
    // Na API real, esta função busca as cargas manuais/importadas para seleção no lançamento.
    let cargasManuais: Carga[] = await fetch(`${API_URL}/cargas-manuais`).then(handleResponse);
    
    // Aplicar filtros no frontend, pois a API simples não os suporta
    if (params) {
        if (params.data) {
            cargasManuais = cargasManuais.filter(c => c.DataCTE === params.data);
        }
        if (params.veiculoCod) {
            cargasManuais = cargasManuais.filter(c => c.COD_VEICULO === params.veiculoCod);
        }
    }
    return cargasManuais.filter(c => !c.Excluido); // Retornar apenas as ativas
};

export const getCargasManuais = (): Promise<Carga[]> => {
    return fetch(`${API_URL}/cargas-manuais`).then(handleResponse);
};

export const getParametrosValores = (): Promise<ParametroValor[]> => {
    return fetch(`${API_URL}/parametros-valores`).then(handleResponse);
};

export const getParametrosTaxas = (): Promise<ParametroTaxa[]> => {
    return fetch(`${API_URL}/parametros-taxas`).then(handleResponse);
};

export const getMotivosSubstituicao = (): Promise<MotivoSubstituicao[]> => {
    // This can remain a local function as it's static data
    return Promise.resolve([
        { ID_Motivo: 1, Descricao: 'Correção de valor' },
        { ID_Motivo: 2, Descricao: 'Alteração de rota' },
        { ID_Motivo: 3, Descricao: 'Lançamento indevido' },
        { ID_Motivo: 4, Descricao: 'Outro' },
    ]);
};

export const getLancamentos = (): Promise<Lancamento[]> => {
    return fetch(`${API_URL}/lancamentos`).then(handleResponse);
};


// --- Funções de Escrita (POST, PUT, DELETE) ---

export const createLancamento = (lancamento: NewLancamento): Promise<Lancamento> => {
    return apiRequest(`${API_URL}/lancamentos`, 'POST', lancamento);
};

export const deleteLancamento = (id: number, motivo: string): Promise<void> => {
    return apiRequest(`${API_URL}/lancamentos/${id}`, 'PUT', { motivo });
};

export const createVeiculo = (veiculo: Omit<Veiculo, 'ID_Veiculo'>): Promise<Veiculo> => {
    return apiRequest(`${API_URL}/veiculos`, 'POST', veiculo);
};

export const updateVeiculo = (id: number, veiculo: Veiculo): Promise<Veiculo> => {
    return apiRequest(`${API_URL}/veiculos/${id}`, 'PUT', veiculo);
};

export const createCarga = (carga: Omit<Carga, 'ID_Carga'>): Promise<Carga> => {
    return apiRequest(`${API_URL}/cargas-manuais`, 'POST', carga);
};

export const updateCarga = (id: number, carga: Carga): Promise<Carga> => {
    return apiRequest(`${API_URL}/cargas-manuais/${id}`, 'PUT', carga);
};

export const deleteCarga = (id: number, motivo: string): Promise<void> => {
    const body = { Excluido: true, MotivoExclusao: motivo };
    return apiRequest(`${API_URL}/cargas-manuais/${id}`, 'PUT', body);
};

export const createParametroValor = (param: Omit<ParametroValor, 'ID_Parametro'>): Promise<ParametroValor> => {
    return apiRequest(`${API_URL}/parametros-valores`, 'POST', param);
};

export const updateParametroValor = (id: number, param: ParametroValor): Promise<ParametroValor> => {
    return apiRequest(`${API_URL}/parametros-valores/${id}`, 'PUT', param);
};

export const deleteParametroValor = (id: number): Promise<void> => {
    return apiRequest(`${API_URL}/parametros-valores/${id}`, 'DELETE');
};

export const createParametroTaxa = (param: Omit<ParametroTaxa, 'ID_Taxa'>): Promise<ParametroTaxa> => {
    return apiRequest(`${API_URL}/parametros-taxas`, 'POST', param);
};

export const updateParametroTaxa = (id: number, param: ParametroTaxa): Promise<ParametroTaxa> => {
    return apiRequest(`${API_URL}/parametros-taxas/${id}`, 'PUT', param);
};

export const deleteParametroTaxa = (id: number): Promise<void> => {
    return apiRequest(`${API_URL}/parametros-taxas/${id}`, 'DELETE');
};


// --- Importação ---

export const importCargasFromERP = async (startDate: string, endDate:string): Promise<{ message: string; count: number }> => {
    const body = { sIni: startDate, sFim: endDate };
    return apiRequest(`${API_URL}/cargas-erp/import`, 'POST', body);
};

// CSV Import is not handled by the API in this version, so no changes needed.
// This function would need a specific backend endpoint if it were to be fully implemented.
export const importData = async (file: File, type: 'veiculos' | 'cargas' | 'parametros-valores' | 'parametros-taxas'): Promise<{ message: string; count: number }> => {
    alert("A importação via CSV para a API ainda não foi implementada. Use a importação do ERP.");
    return Promise.resolve({ message: 'Função não implementada para API real.', count: 0 });
};
