import { Veiculo, Carga, ParametroValor, ParametroTaxa, MotivoSubstituicao, Lancamento, NewLancamento } from '../types';

// Declare PapaParse which is loaded from a CDN in index.html
declare const Papa: any;

// --- CONFIGURAÇÃO DA API ---
// IMPORTANTE: Altere o IP abaixo para o endereço do servidor onde sua API está rodando.
// Se estiver testando localmente, pode ser 'localhost'. No servidor de produção, será o IP da máquina.
const API_URL = 'http://localhost:3000'; 

// Helper para tratar respostas da API
const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Erro HTTP ${response.status}`);
    }
    if (response.status === 204) { // No Content
        return;
    }
    return response.json();
};

// --- Funções de Leitura (GET) ---

export const getVeiculos = async (): Promise<Veiculo[]> => {
    const response = await fetch(`${API_URL}/veiculos`);
    return handleResponse(response);
};

export const getCargas = async (filters?: { veiculoCod?: string; data?: string }): Promise<Carga[]> => {
    // Esta função agora busca as cargas do ERP para um período padrão.
    // A busca de cargas manuais é feita separadamente em GestaoCargas.
    const hoje = new Date();
    const trintaDiasAtras = new Date(new Date().setDate(hoje.getDate() - 30));
    
    // Formata as datas como YYYY-MM-DD
    const sFim = hoje.toISOString().split('T')[0];
    const sIni = trintaDiasAtras.toISOString().split('T')[0];

    // O endpoint /cargas-erp espera datas para filtrar os resultados
    const response = await fetch(`${API_URL}/cargas-erp?sIni=${sIni}&sFim=${sFim}`);
    const erpCargas = await handleResponse(response);

    // Busca também as cargas manuais para compor a lista completa
    const responseManual = await fetch(`${API_URL}/cargas-manuais`);
    const manualCargas = await handleResponse(responseManual);
    
    // Retorna a união das cargas do ERP (ID negativo) e manuais (ID positivo)
    return [...erpCargas, ...manualCargas];
};

// Função específica para a tela de Gestão de Cargas (apenas manuais)
export const getCargasManuais = async (): Promise<Carga[]> => {
    const response = await fetch(`${API_URL}/cargas-manuais`);
    return handleResponse(response);
};


export const getParametrosValores = async (): Promise<ParametroValor[]> => {
    const response = await fetch(`${API_URL}/parametros-valores`);
    return handleResponse(response);
};

export const getParametrosTaxas = async (): Promise<ParametroTaxa[]> => {
    const response = await fetch(`${API_URL}/parametros-taxas`);
    return handleResponse(response);
};

export const getMotivosSubstituicao = async (): Promise<MotivoSubstituicao[]> => {
    // Mantendo mockado pois não há uma tabela no banco para isso
    return Promise.resolve([
        { ID_Motivo: 1, Descricao: 'Correção de valor' },
        { ID_Motivo: 2, Descricao: 'Alteração de rota' },
        { ID_Motivo: 3, Descricao: 'Lançamento indevido' },
        { ID_Motivo: 4, Descricao: 'Outro' },
    ]);
};

export const getLancamentos = async (): Promise<Lancamento[]> => {
    const response = await fetch(`${API_URL}/lancamentos`);
    return handleResponse(response);
};

// --- Funções de Escrita (POST, PUT, DELETE) ---

const apiRequest = async (url: string, method: 'POST' | 'PUT' | 'DELETE', body?: any) => {
    const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    };
    const response = await fetch(url, options);
    return handleResponse(response);
};

// Lançamentos
export const createLancamento = (lancamento: NewLancamento): Promise<Lancamento> => {
    return apiRequest(`${API_URL}/lancamentos`, 'POST', lancamento);
};

export const updateLancamento = (id: number, lancamento: Lancamento): Promise<Lancamento> => {
    // A API não tem um endpoint de PUT para lançamentos, a edição é feita via nova criação
    // A exclusão lógica é o único "update"
    throw new Error("A atualização de lançamentos não é suportada pela API. Crie um novo e exclua o antigo.");
};

export const deleteLancamento = (id: number, motivo: string): Promise<void> => {
    return apiRequest(`${API_URL}/lancamentos/${id}`, 'PUT', { motivo }); // PUT para exclusão lógica
};

// Veículos
export const createVeiculo = (veiculo: Omit<Veiculo, 'ID_Veiculo'>): Promise<Veiculo> => {
    return apiRequest(`${API_URL}/veiculos`, 'POST', veiculo);
};

export const updateVeiculo = (id: number, veiculo: Veiculo): Promise<Veiculo> => {
    return apiRequest(`${API_URL}/veiculos/${id}`, 'PUT', veiculo);
};

// Cargas Manuais
export const createCarga = (carga: Omit<Carga, 'ID_Carga'>): Promise<Carga> => {
    return apiRequest(`${API_URL}/cargas-manuais`, 'POST', carga);
};

export const updateCarga = (id: number, carga: Carga): Promise<Carga> => {
    return apiRequest(`${API_URL}/cargas-manuais/${id}`, 'PUT', carga);
};

export const deleteCarga = (id: number, motivo: string): Promise<void> => {
    // A exclusão de carga é um update que marca como excluído
    const url = `${API_URL}/cargas-manuais/${id}`;
    return apiRequest(url, 'PUT', { Excluido: true, MotivoExclusao: motivo });
};


// Parâmetros de Valor (assumindo que a API os suporta)
export const createParametroValor = (param: Omit<ParametroValor, 'ID_Parametro'>): Promise<ParametroValor> => {
    return apiRequest(`${API_URL}/parametros-valores`, 'POST', param);
};
export const updateParametroValor = (id: number, param: ParametroValor): Promise<ParametroValor> => {
    return apiRequest(`${API_URL}/parametros-valores/${id}`, 'PUT', param);
};
export const deleteParametroValor = (id: number): Promise<void> => {
    return apiRequest(`${API_URL}/parametros-valores/${id}`, 'DELETE');
};

// Parâmetros de Taxa (assumindo que a API os suporta)
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
export const importData = async (file: File, type: 'veiculos' | 'cargas' | 'parametros-valores' | 'parametros-taxas'): Promise<{ message: string; count: number }> => {
    // A importação via CSV agora deve ser tratada pelo backend.
    // Esta função precisaria ser reescrita para fazer upload do arquivo para um endpoint da API.
    // Por simplicidade, vamos manter a lógica de parse no frontend, mas enviar os dados em JSON.
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results: { data: any[] }) => {
                try {
                    // A API poderia ter um endpoint de "importação em lote"
                    // Ex: POST /veiculos/import
                    // Por enquanto, vamos simular, pois a API não tem esse endpoint.
                    console.log(`Dados para importar para '${type}':`, results.data);
                    
                    // TODO: Implementar chamadas para a API para cada linha (ou para um endpoint de lote)
                    
                    resolve({ message: `Importação de ${type} processada no frontend.`, count: results.data.length });
                } catch (error) {
                    reject(error);
                }
            },
            error: (error: any) => reject(new Error('Erro ao ler o arquivo CSV: ' + error.message))
        });
    });
};
