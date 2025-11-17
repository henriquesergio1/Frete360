import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Veiculo, ParametroValor, ParametroTaxa, Carga, Lancamento, NewLancamento } from '../types';
import * as api from '../services/apiService';
import { API_MODE } from '../api.config';

interface DataContextType {
    veiculos: Veiculo[];
    parametrosValores: ParametroValor[];
    parametrosTaxas: ParametroTaxa[];
    cargas: Carga[]; // Manterá apenas as cargas manuais para a tela de gestão
    lancamentos: Lancamento[];
    tiposVeiculo: string[];
    cidades: string[];
    editingLancamento: Lancamento | null;
    loading: boolean;
    error: string | null;

    setEditingLancamento: (lancamento: Lancamento | null) => void;
    reloadData: (dataType: 'veiculos' | 'cargas' | 'parametrosValores' | 'parametrosTaxas' | 'lancamentos' | 'all') => Promise<void>;
    
    // CRUD operations
    addLancamento: (lancamento: NewLancamento) => Promise<Lancamento>;
    updateLancamento: (lancamento: Lancamento) => Promise<Lancamento>;
    deleteLancamento: (id: number, motivo: string) => Promise<void>;
    
    addVeiculo: (veiculo: Omit<Veiculo, 'ID_Veiculo'>) => Promise<void>;
    updateVeiculo: (veiculo: Veiculo) => Promise<void>;

    addCarga: (carga: Omit<Carga, 'ID_Carga'>) => Promise<void>;
    updateCarga: (carga: Carga) => Promise<void>;
    deleteCarga: (id: number, motivo: string) => Promise<void>;
}

export const DataContext = createContext<DataContextType>({} as DataContextType);

export const DataProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
    const [parametrosValores, setParametrosValores] = useState<ParametroValor[]>([]);
    const [parametrosTaxas, setParametrosTaxas] = useState<ParametroTaxa[]>([]);
    const [cargas, setCargas] = useState<Carga[]>([]); // Cargas manuais
    const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
    
    const [tiposVeiculo, setTiposVeiculo] = useState<string[]>([]);
    const [cidades, setCidades] = useState<string[]>([]);

    const [editingLancamento, setEditingLancamento] = useState<Lancamento | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadInitialData = useCallback(async () => {
        try {
            setError(null);
            setLoading(true);
            const [veiculosData, pValoresData, pTaxasData, cargasManuaisData, lancamentosData] = await Promise.all([
                api.getVeiculos(),
                api.getParametrosValores(),
                api.getParametrosTaxas(),
                api.getCargasManuais(),
                api.getLancamentos(),
            ]);
            setVeiculos(veiculosData);
            setParametrosValores(pValoresData);
            setParametrosTaxas(pTaxasData);
            setCargas(cargasManuaisData);
            setLancamentos(lancamentosData);
        } catch (err: any) {
            console.error("Erro ao carregar dados:", err);
            const errorMessage = API_MODE === 'api' 
                ? 'Falha ao conectar com o backend. Verifique se a API está em execução.' 
                : 'Falha ao carregar dados fictícios.';
            setError(`${errorMessage} Detalhe: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        const allTipos = [...new Set(veiculos.map(v => v.TipoVeiculo))].sort();
        const allCidades = [...new Set([
            ...cargas.map(c => c.Cidade),
            ...parametrosValores.map(p => p.Cidade),
            ...parametrosTaxas.map(t => t.Cidade)
        ])].filter(Boolean).sort();
        setTiposVeiculo(allTipos);
        setCidades(allCidades);
    }, [veiculos, cargas, parametrosValores, parametrosTaxas]);

    const reloadData = useCallback(async (dataType: 'veiculos' | 'cargas' | 'parametrosValores' | 'parametrosTaxas' | 'lancamentos' | 'all') => {
        if (dataType === 'all') {
            await loadInitialData();
            return;
        }
        try {
            // setLoading(true); // Opcional: mostrar loading em recargas parciais
            switch (dataType) {
                case 'veiculos': setVeiculos(await api.getVeiculos()); break;
                case 'cargas': setCargas(await api.getCargasManuais()); break;
                case 'parametrosValores': setParametrosValores(await api.getParametrosValores()); break;
                case 'parametrosTaxas': setParametrosTaxas(await api.getParametrosTaxas()); break;
                case 'lancamentos': setLancamentos(await api.getLancamentos()); break;
            }
        } catch (err: any) {
            setError(`Falha ao recarregar dados de ${dataType}: ${err.message}`);
        } finally {
            // setLoading(false);
        }
    }, [loadInitialData]);
    
    // --- CRUD Handlers ---

    const addLancamento = async (lancamento: NewLancamento): Promise<Lancamento> => {
        const newLancamento = await api.createLancamento(lancamento);
        await reloadData('lancamentos');
        return newLancamento;
    };

    const updateLancamento = async (lancamento: Lancamento): Promise<Lancamento> => {
        // A API atual não suporta edição, apenas criação de um novo e exclusão do antigo.
        // Simulamos aqui para o modo MOCK, mas a API real deveria implementar isso.
        console.warn("A atualização de lançamentos não é suportada pela API. Criando um novo...");
        const novoLancamento = await addLancamento(lancamento);
        await deleteLancamento(lancamento.ID_Lancamento, lancamento.Motivo || 'Substituição por edição.');
        return novoLancamento;
    };

    const deleteLancamento = async (id: number, motivo: string) => {
        await api.deleteLancamento(id, motivo);
        await reloadData('lancamentos');
    };
    
    const addVeiculo = async (veiculo: Omit<Veiculo, 'ID_Veiculo'>) => {
        await api.createVeiculo(veiculo);
        await reloadData('veiculos');
    };
    const updateVeiculo = async (veiculo: Veiculo) => {
        await api.updateVeiculo(veiculo.ID_Veiculo, veiculo);
        await reloadData('veiculos');
    };

    const addCarga = async (carga: Omit<Carga, 'ID_Carga'>) => {
        await api.createCarga(carga);
        await reloadData('cargas');
    };
    const updateCarga = async (carga: Carga) => {
        await api.updateCarga(carga.ID_Carga, carga);
        await reloadData('cargas');
    };
    const deleteCarga = async (id: number, motivo: string) => {
        await api.deleteCarga(id, motivo);
        await reloadData('cargas');
    };

    return (
        <DataContext.Provider value={{
            veiculos,
            parametrosValores,
            parametrosTaxas,
            cargas,
            lancamentos,
            tiposVeiculo,
            cidades,
            editingLancamento,
            loading,
            error,
            setEditingLancamento,
            reloadData,
            addLancamento,
            updateLancamento,
            deleteLancamento,
            addVeiculo,
            updateVeiculo,
            addCarga,
            updateCarga,
            deleteCarga,
        }}>
            {children}
        </DataContext.Provider>
    );
};
