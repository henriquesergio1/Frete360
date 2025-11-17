import { Veiculo, Carga, ParametroValor, ParametroTaxa, MotivoSubstituicao, Lancamento } from '../types';

// --- MOCK DATA ---
// Simula o estado do banco de dados para desenvolvimento offline.

// Veículos
const mockVeiculos: Veiculo[] = [
    { ID_Veiculo: 1, COD_Veiculo: 'TRUCK001', Placa: 'ABC-1234', TipoVeiculo: 'Carreta', Motorista: 'João da Silva', CapacidadeKG: 25000, Ativo: true },
    { ID_Veiculo: 2, COD_Veiculo: 'TRUCK002', Placa: 'DEF-5678', TipoVeiculo: 'Truck', Motorista: 'Maria Oliveira', CapacidadeKG: 12000, Ativo: true },
    { ID_Veiculo: 3, COD_Veiculo: 'VAN001', Placa: 'GHI-9012', TipoVeiculo: 'VUC', Motorista: 'Pedro Martins', CapacidadeKG: 3000, Ativo: false },
    { ID_Veiculo: 4, COD_Veiculo: 'TRUCK003', Placa: 'JKL-3456', TipoVeiculo: 'Carreta', Motorista: 'Carlos Pereira', CapacidadeKG: 27000, Ativo: true },
];

// Cargas (Manuais e do ERP)
const mockCargas: Carga[] = [
    // Cargas do ERP (simuladas com ID negativo)
    { ID_Carga: -1, NumeroCarga: 'ERP-77890', Cidade: 'Belo Horizonte', ValorCTE: 1200.50, DataCTE: '2024-05-20', KM: 350, COD_VEICULO: 'TRUCK001' },
    { ID_Carga: -2, NumeroCarga: 'ERP-77891', Cidade: 'Rio de Janeiro', ValorCTE: 1850.00, DataCTE: '2024-05-21', KM: 450, COD_VEICULO: 'TRUCK001' },
    { ID_Carga: -3, NumeroCarga: 'ERP-77892', Cidade: 'Curitiba', ValorCTE: 2200.75, DataCTE: '2024-05-22', KM: 850, COD_VEICULO: 'TRUCK003' },
    // Cargas Manuais (simuladas com ID positivo)
    { ID_Carga: 1, NumeroCarga: 'MAN-001', Cidade: 'Campinas', ValorCTE: 500.00, DataCTE: '2024-05-23', KM: 95, COD_VEICULO: 'TRUCK002' },
    { ID_Carga: 2, NumeroCarga: 'MAN-002', Cidade: 'Santos', ValorCTE: 450.00, DataCTE: '2024-05-24', KM: 75, COD_VEICULO: 'TRUCK002', Excluido: true, MotivoExclusao: 'Lançamento duplicado' },
];

// Parâmetros de Valor
const mockParametrosValores: ParametroValor[] = [
    { ID_Parametro: 1, Cidade: 'Qualquer', TipoVeiculo: 'Carreta', ValorBase: 1500, KM: 0 },
    { ID_Parametro: 2, Cidade: 'Qualquer', TipoVeiculo: 'Truck', ValorBase: 1000, KM: 0 },
    { ID_Parametro: 3, Cidade: 'Qualquer', TipoVeiculo: 'VUC', ValorBase: 500, KM: 0 },
    { ID_Parametro: 4, Cidade: 'Belo Horizonte', TipoVeiculo: 'Carreta', ValorBase: 2200, KM: 350 },
    { ID_Parametro: 5, Cidade: 'Rio de Janeiro', TipoVeiculo: 'Carreta', ValorBase: 1800, KM: 450 },
    { ID_Parametro: 6, Cidade: 'Curitiba', TipoVeiculo: 'Carreta', ValorBase: 1750, KM: 850 },
];

// Parâmetros de Taxas
const mockParametrosTaxas: ParametroTaxa[] = [
    { ID_Taxa: 1, Cidade: 'Belo Horizonte', Pedagio: 50.50, Balsa: 0, Ambiental: 0, Chapa: 100, Outras: 10 },
    { ID_Taxa: 2, Cidade: 'Rio de Janeiro', Pedagio: 75.00, Balsa: 0, Ambiental: 20, Chapa: 150, Outras: 0 },
    { ID_Taxa: 3, Cidade: 'Curitiba', Pedagio: 120.00, Balsa: 0, Ambiental: 0, Chapa: 0, Outras: 30 },
    { ID_Taxa: 4, Cidade: 'Campinas', Pedagio: 25.00, Balsa: 0, Ambiental: 0, Chapa: 0, Outras: 0 },
];

// Motivos de Substituição
const mockMotivosSubstituicao: MotivoSubstituicao[] = [
    { ID_Motivo: 1, Descricao: 'Correção de valor' },
    { ID_Motivo: 2, Descricao: 'Alteração de rota' },
    { ID_Motivo: 3, Descricao: 'Lançamento indevido' },
    { ID_Motivo: 4, Descricao: 'Outro' },
];

// Lançamentos
const mockLancamentos: Lancamento[] = [
    {
        ID_Lancamento: 1,
        DataFrete: '2024-05-21',
        ID_Veiculo: 1,
        Cargas: [mockCargas[0], mockCargas[1]],
        Calculo: { CidadeBase: 'Rio de Janeiro', KMBase: 450, ValorBase: 1800, Pedagio: 125.50, Balsa: 0, Ambiental: 20, Chapa: 250, Outras: 10, ValorTotal: 2205.50 },
        Usuario: 'sistema',
        Excluido: false,
    },
    {
        ID_Lancamento: 2,
        DataFrete: '2024-05-22',
        ID_Veiculo: 4,
        Cargas: [mockCargas[2]],
        Calculo: { CidadeBase: 'Curitiba', KMBase: 850, ValorBase: 1750, Pedagio: 120.00, Balsa: 0, Ambiental: 0, Chapa: 0, Outras: 30, ValorTotal: 1900.00 },
        Usuario: 'sistema',
        Motivo: 'Correção de valor',
        Excluido: false,
    },
     {
        ID_Lancamento: 3,
        DataFrete: '2024-05-20',
        ID_Veiculo: 1,
        Cargas: [mockCargas[0]],
        Calculo: { CidadeBase: 'Belo Horizonte', KMBase: 350, ValorBase: 2200, Pedagio: 50.50, Balsa: 0, Ambiental: 0, Chapa: 100, Outras: 10, ValorTotal: 2360.50 },
        Usuario: 'sistema',
        Excluido: true,
        MotivoExclusao: 'Lançamento incorreto.'
    },
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));


// --- Funções Mock ---
export const getMockVeiculos = async (): Promise<Veiculo[]> => {
    await delay(100);
    return Promise.resolve([...mockVeiculos]);
};

// FIX: Update getMockCargas to accept parameters for filtering.
export const getMockCargas = async (params?: { veiculoCod?: string, data?: string }): Promise<Carga[]> => {
    await delay(100);
    let cargas = [...mockCargas];
    if (params) {
        if (params.data) {
            cargas = cargas.filter(c => c.DataCTE === params.data);
        }
        if (params.veiculoCod) {
            cargas = cargas.filter(c => c.COD_VEICULO === params.veiculoCod);
        }
    }
    return Promise.resolve(cargas);
};

export const getMockCargasManuais = async (): Promise<Carga[]> => {
    await delay(100);
    return Promise.resolve(mockCargas.filter(c => c.ID_Carga > 0));
};

export const getMockParametrosValores = async (): Promise<ParametroValor[]> => {
    await delay(100);
    return Promise.resolve([...mockParametrosValores]);
};

export const getMockParametrosTaxas = async (): Promise<ParametroTaxa[]> => {
    await delay(100);
    return Promise.resolve([...mockParametrosTaxas]);
};

export const getMockMotivosSubstituicao = async (): Promise<MotivoSubstituicao[]> => {
    return Promise.resolve([...mockMotivosSubstituicao]);
};

export const getMockLancamentos = async (): Promise<Lancamento[]> => {
    await delay(150);
    return Promise.resolve([...mockLancamentos]);
};