import { Veiculo, Carga, ParametroValor, ParametroTaxa, MotivoSubstituicao, Lancamento, NewLancamento } from '../types';

// Declare PapaParse which is loaded from a CDN in index.html
declare const Papa: any;

// --- MOCK DATA ---
// To allow the application to run without a backend, we're using mock data.

let mockVeiculos: Veiculo[] = [
    { ID_Veiculo: 1, COD_Veiculo: 'TRK001', Placa: 'ABC-1234', TipoVeiculo: 'Carreta', Motorista: 'João da Silva', CapacidadeKG: 25000, Ativo: true },
    { ID_Veiculo: 2, COD_Veiculo: 'TRK002', Placa: 'DEF-5678', TipoVeiculo: 'Truck', Motorista: 'Maria Oliveira', CapacidadeKG: 12000, Ativo: true },
    { ID_Veiculo: 3, COD_Veiculo: 'TRK003', Placa: 'GHI-9012', TipoVeiculo: 'Carreta', Motorista: 'Carlos Pereira', CapacidadeKG: 27000, Ativo: true },
    { ID_Veiculo: 4, COD_Veiculo: 'VUC001', Placa: 'JKL-3456', TipoVeiculo: 'VUC', Motorista: 'Ana Costa', CapacidadeKG: 3000, Ativo: false },
];

let mockCargas: Carga[] = [
    { ID_Carga: 1, NumeroCarga: 'CTE-1001', Cidade: 'São Paulo', ValorCTE: 1200, DataCTE: '2024-07-28', KM: 586, COD_VEICULO: 'TRK001' },
    { ID_Carga: 2, NumeroCarga: 'CTE-1002', Cidade: 'Rio de Janeiro', ValorCTE: 850, DataCTE: '2024-07-28', KM: 430, COD_VEICULO: 'TRK001' },
    { ID_Carga: 3, NumeroCarga: 'CTE-1003', Cidade: 'Curitiba', ValorCTE: 1500, DataCTE: '2024-07-29', KM: 408, COD_VEICULO: 'TRK002' },
    { ID_Carga: 4, NumeroCarga: 'CTE-1004', Cidade: 'Belo Horizonte', ValorCTE: 950, DataCTE: '2024-07-29', KM: 586, COD_VEICULO: 'TRK003' },
    { ID_Carga: 5, NumeroCarga: 'CTE-1005', Cidade: 'Santos', ValorCTE: 400, DataCTE: new Date().toISOString().split('T')[0], KM: 77, COD_VEICULO: 'TRK002' },
    { ID_Carga: 6, NumeroCarga: 'CTE-1006', Cidade: 'Campinas', ValorCTE: 350, DataCTE: new Date().toISOString().split('T')[0], KM: 98, COD_VEICULO: 'TRK003' },
];

let mockParametrosValores: ParametroValor[] = [
    { ID_Parametro: 1, Cidade: 'São Paulo', TipoVeiculo: 'Carreta', ValorBase: 1800, KM: 586 },
    { ID_Parametro: 2, Cidade: 'Rio de Janeiro', TipoVeiculo: 'Carreta', ValorBase: 1500, KM: 430 },
    { ID_Parametro: 3, Cidade: 'Curitiba', TipoVeiculo: 'Truck', ValorBase: 1200, KM: 408 },
    { ID_Parametro: 4, Cidade: 'Belo Horizonte', TipoVeiculo: 'Carreta', ValorBase: 1600, KM: 586 },
    { ID_Parametro: 5, Cidade: 'Santos', TipoVeiculo: 'Truck', ValorBase: 500, KM: 77 },
    { ID_Parametro: 6, Cidade: 'Campinas', TipoVeiculo: 'Carreta', ValorBase: 450, KM: 98 },
    { ID_Parametro: 7, Cidade: 'Qualquer', TipoVeiculo: 'Carreta', ValorBase: 1000, KM: 0 },
    { ID_Parametro: 8, Cidade: 'Qualquer', TipoVeiculo: 'Truck', ValorBase: 800, KM: 0 },
];

let mockParametrosTaxas: ParametroTaxa[] = [
    { ID_Taxa: 1, Cidade: 'São Paulo', Pedagio: 120, Balsa: 0, Ambiental: 0, Chapa: 50, Outras: 10 },
    { ID_Taxa: 2, Cidade: 'Rio de Janeiro', Pedagio: 150, Balsa: 0, Ambiental: 20, Chapa: 0, Outras: 0 },
    { ID_Taxa: 3, Cidade: 'Curitiba', Pedagio: 90, Balsa: 0, Ambiental: 0, Chapa: 0, Outras: 0 },
    { ID_Taxa: 4, Cidade: 'Santos', Pedagio: 80, Balsa: 30, Ambiental: 15, Chapa: 0, Outras: 0 },
    { ID_Taxa: 5, Cidade: 'Campinas', Pedagio: 45, Balsa: 0, Ambiental: 0, Chapa: 0, Outras: 0 },
];

let mockMotivos: MotivoSubstituicao[] = [
    { ID_Motivo: 1, Descricao: 'Correção de valor' },
    { ID_Motivo: 2, Descricao: 'Alteração de rota' },
    { ID_Motivo: 3, Descricao: 'Lançamento indevido' },
    { ID_Motivo: 4, Descricao: 'Outro' },
];

let mockLancamentos: Lancamento[] = [
    {
        ID_Lancamento: 1,
        DataFrete: '2024-07-28',
        ID_Veiculo: 1,
        Cargas: [mockCargas[0], mockCargas[1]],
        Calculo: {
            CidadeBase: 'São Paulo',
            KMBase: 586,
            ValorBase: 1800,
            Pedagio: 270,
            Balsa: 0,
            Ambiental: 20,
            Chapa: 50,
            Outras: 10,
            ValorTotal: 2150,
        },
        Usuario: 'sistema',
    }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// --- Funções de Leitura (GET) ---

export const getVeiculos = async (): Promise<Veiculo[]> => {
    await delay(200);
    return Promise.resolve([...mockVeiculos]);
};

export const getCargas = async (filters?: { veiculoCod?: string; data?: string }): Promise<Carga[]> => {
    await delay(300);
    let cargas = [...mockCargas];
    if (filters?.veiculoCod && filters?.data) {
        cargas = cargas.filter(c => c.COD_VEICULO === filters.veiculoCod && c.DataCTE === filters.data);
    }
    return Promise.resolve(cargas);
};

export const getParametrosValores = async (): Promise<ParametroValor[]> => {
    await delay(100);
    return Promise.resolve([...mockParametrosValores]);
};

export const getParametrosTaxas = async (): Promise<ParametroTaxa[]> => {
    await delay(100);
    return Promise.resolve([...mockParametrosTaxas]);
};

export const getMotivosSubstituicao = async (): Promise<MotivoSubstituicao[]> => {
    return Promise.resolve([...mockMotivos]);
};

export const getLancamentos = async (): Promise<Lancamento[]> => {
    await delay(400);
    return Promise.resolve([...mockLancamentos]);
};


// --- Funções de Escrita (POST, PUT, DELETE) ---

// Lançamentos
export const createLancamento = async (lancamento: NewLancamento): Promise<Lancamento> => {
    await delay(500);
    const newId = Math.max(0, ...mockLancamentos.map(l => l.ID_Lancamento)) + 1;
    const newLancamento: Lancamento = { ...lancamento, ID_Lancamento: newId };
    mockLancamentos.push(newLancamento);
    return Promise.resolve(newLancamento);
};

export const updateLancamento = async (id: number, lancamento: Lancamento): Promise<Lancamento> => {
    await delay(500);
    const index = mockLancamentos.findIndex(l => l.ID_Lancamento === id);
    if (index > -1) {
        mockLancamentos[index] = lancamento;
        return Promise.resolve(lancamento);
    }
    return Promise.reject(new Error("Lançamento não encontrado."));
};

export const deleteLancamento = async (id: number, motivo: string): Promise<void> => {
    await delay(500);
    const index = mockLancamentos.findIndex(l => l.ID_Lancamento === id);
    if (index > -1) {
        mockLancamentos[index].Excluido = true;
        mockLancamentos[index].MotivoExclusao = motivo;
        return Promise.resolve();
    }
    return Promise.reject(new Error("Lançamento não encontrado."));
};

// Veículos
export const createVeiculo = async (veiculo: Omit<Veiculo, 'ID_Veiculo'>): Promise<Veiculo> => {
    await delay(200);
    const newId = Math.max(0, ...mockVeiculos.map(v => v.ID_Veiculo)) + 1;
    const newVeiculo = { ...veiculo, ID_Veiculo: newId };
    mockVeiculos.push(newVeiculo);
    return Promise.resolve(newVeiculo);
};

export const updateVeiculo = async (id: number, veiculo: Veiculo): Promise<Veiculo> => {
     await delay(200);
    const index = mockVeiculos.findIndex(v => v.ID_Veiculo === id);
    if (index > -1) {
        mockVeiculos[index] = veiculo;
        return Promise.resolve(veiculo);
    }
    return Promise.reject(new Error("Veículo não encontrado."));
};

// Cargas
export const createCarga = async (carga: Omit<Carga, 'ID_Carga'>): Promise<Carga> => {
    await delay(200);
    const newId = Math.max(0, ...mockCargas.map(c => c.ID_Carga)) + 1;
    const newCarga = { ...carga, ID_Carga: newId };
    mockCargas.push(newCarga);
    return Promise.resolve(newCarga);
};

export const updateCarga = async (id: number, carga: Carga): Promise<Carga> => {
     await delay(200);
    const index = mockCargas.findIndex(c => c.ID_Carga === id);
    if (index > -1) {
        mockCargas[index] = carga;
        return Promise.resolve(carga);
    }
    return Promise.reject(new Error("Carga não encontrada."));
};

export const deleteCarga = async (id: number, motivo: string): Promise<void> => {
    await delay(200);
    const index = mockCargas.findIndex(c => c.ID_Carga === id);
    if (index > -1) {
        mockCargas[index].Excluido = true;
        mockCargas[index].MotivoExclusao = motivo;
        return Promise.resolve();
    }
    return Promise.reject(new Error("Carga não encontrada."));
};

// Parâmetros de Valor
export const createParametroValor = async (param: Omit<ParametroValor, 'ID_Parametro'>): Promise<ParametroValor> => {
    await delay(200);
    const newId = Math.max(0, ...mockParametrosValores.map(p => p.ID_Parametro)) + 1;
    const newParam = { ...param, ID_Parametro: newId };
    mockParametrosValores.push(newParam);
    return Promise.resolve(newParam);
};

export const updateParametroValor = async (id: number, param: ParametroValor): Promise<ParametroValor> => {
     await delay(200);
    const index = mockParametrosValores.findIndex(p => p.ID_Parametro === id);
    if (index > -1) {
        mockParametrosValores[index] = param;
        return Promise.resolve(param);
    }
    return Promise.reject(new Error("Parâmetro de valor não encontrado."));
};

export const deleteParametroValor = async (id: number): Promise<void> => {
    await delay(200);
    mockParametrosValores = mockParametrosValores.filter(p => p.ID_Parametro !== id);
    return Promise.resolve();
};

// Parâmetros de Taxa
export const createParametroTaxa = async (param: Omit<ParametroTaxa, 'ID_Taxa'>): Promise<ParametroTaxa> => {
    await delay(200);
    const newId = Math.max(0, ...mockParametrosTaxas.map(p => p.ID_Taxa)) + 1;
    const newParam = { ...param, ID_Taxa: newId };
    mockParametrosTaxas.push(newParam);
    return Promise.resolve(newParam);
};

export const updateParametroTaxa = async (id: number, param: ParametroTaxa): Promise<ParametroTaxa> => {
     await delay(200);
    const index = mockParametrosTaxas.findIndex(p => p.ID_Taxa === id);
    if (index > -1) {
        mockParametrosTaxas[index] = param;
        return Promise.resolve(param);
    }
    return Promise.reject(new Error("Parâmetro de taxa não encontrado."));
};

export const deleteParametroTaxa = async (id: number): Promise<void> => {
    await delay(200);
    mockParametrosTaxas = mockParametrosTaxas.filter(p => p.ID_Taxa !== id);
    return Promise.resolve();
};

// --- Importação ---
export const importData = async (file: File, type: 'veiculos' | 'cargas' | 'parametros-valores' | 'parametros-taxas'): Promise<{ message: string; count: number }> => {
    await delay(1000);

    if (type === 'cargas') {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results: { data: any[] }) => {
                    try {
                        const data = results.data;
                        const groupedCargas: { [key: string]: Omit<Carga, 'ID_Carga' | 'KM'> & { ValorCTE: number } } = {};

                        // Step 1: Group by NumeroCarga and Cidade, and sum ValorCTE
                        for (const row of data) {
                            if (!row.NumeroCarga || !row.Cidade) continue;
                            const key = `${row.NumeroCarga}|${row.Cidade}`;
                            
                            if (!groupedCargas[key]) {
                                groupedCargas[key] = {
                                    NumeroCarga: row.NumeroCarga,
                                    Cidade: row.Cidade,
                                    ValorCTE: parseFloat(row.ValorCTE) || 0,
                                    DataCTE: row.DataCTE,
                                    COD_VEICULO: row.COD_VEICULO,
                                };
                            } else {
                                groupedCargas[key].ValorCTE += parseFloat(row.ValorCTE) || 0;
                            }
                        }

                        const newCargas: Omit<Carga, 'ID_Carga'>[] = [];
                        
                        // Step 2: Look up KM for each grouped carga
                        for (const key in groupedCargas) {
                            const groupedCarga = groupedCargas[key];
                            const veiculo = mockVeiculos.find(v => v.COD_Veiculo === groupedCarga.COD_VEICULO);
                            
                            if (!veiculo) {
                                console.warn(`Veículo com código ${groupedCarga.COD_VEICULO} não encontrado para a carga ${groupedCarga.NumeroCarga}. KM será 0.`);
                                newCargas.push({ ...groupedCarga, KM: 0 });
                                continue;
                            }

                            const tipoVeiculo = veiculo.TipoVeiculo;
                            
                            const parametroValor = 
                                mockParametrosValores.find(p => p.Cidade === groupedCarga.Cidade && p.TipoVeiculo === tipoVeiculo) ||
                                mockParametrosValores.find(p => p.Cidade === 'Qualquer' && p.TipoVeiculo === tipoVeiculo);

                            const km = parametroValor ? parametroValor.KM : 0;
                            
                            if (!parametroValor) {
                                 console.warn(`Parâmetro de valor não encontrado para Cidade: ${groupedCarga.Cidade} e TipoVeiculo: ${tipoVeiculo}. KM será 0.`);
                            }
                            
                            newCargas.push({ ...groupedCarga, KM: km });
                        }

                        // Step 3: Add new cargas to the mock data source
                        let nextId = Math.max(0, ...mockCargas.map(c => c.ID_Carga)) + 1;
                        for (const carga of newCargas) {
                            mockCargas.push({ ...carga, ID_Carga: nextId++ });
                        }

                        resolve({ message: 'Importação de cargas concluída!', count: newCargas.length });

                    } catch (error) {
                        console.error("Erro ao processar arquivo de cargas:", error);
                        reject(new Error('Formato de arquivo CSV inválido ou dados corrompidos.'));
                    }
                },
                error: (error: any) => {
                    reject(new Error('Erro ao ler o arquivo CSV: ' + error.message));
                }
            });
        });
    }

    // This is a mock import for other types, so we just return a success message.
    return Promise.resolve({ message: 'Importação simulada com sucesso!', count: Math.floor(Math.random() * 50) + 5 });
};
