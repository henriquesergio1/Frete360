import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Veiculo, ParametroValor, ParametroTaxa, Carga, Lancamento } from '../types';
import * as api from '../services/apiService';

interface DataContextType {
    veiculos: Veiculo[];
    parametrosValores: ParametroValor[];
    parametrosTaxas: ParametroTaxa[];
    cargas: Carga[];
    lancamentos: Lancamento[];
    tiposVeiculo: string[];
    cidades: string[];
    editingLancamento: Lancamento | null;
    loading: boolean;
    error: string | null;

    setEditingLancamento: (lancamento: Lancamento | null) => void;
    reloadData: (dataType: 'veiculos' | 'cargas' | 'parametrosValores' | 'parametrosTaxas' | 'lancamentos' | 'all') => Promise<void>;
    
    // CRUD operations
    addLancamento: (lancamento: Omit<Lancamento, 'ID_Lancamento'>) => Promise<Lancamento>;
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
    const [cargas, setCargas] = useState<Carga[]>([]);
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
            const [veiculosData, pValoresData, pTaxasData, cargasData, lancamentosData] = await Promise.all([
                api.getVeiculos(),
                api.getParametrosValores(),
                api.getParametrosTaxas(),
                api.getCargas(),
                api.getLancamentos(),
            ]);
            setVeiculos(veiculosData);
            setParametrosValores(pValoresData);
            setParametrosTaxas(pTaxasData);
            setCargas(cargasData);
            setLancamentos(lancamentosData);
        } catch (err: any) {
            setError(err.message || 'Falha ao carregar dados iniciais.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        // Derive types and cities from loaded data
        const allTipos = [...new Set(veiculos.map(v => v.TipoVeiculo))].sort();
        const allCidades = [...new Set([
            ...cargas.map(c => c.Cidade),
            ...parametrosValores.map(p => p.Cidade),
            ...parametrosTaxas.map(t => t.Cidade)
        ])].sort();
        setTiposVeiculo(allTipos);
        setCidades(allCidades);
    }, [veiculos, cargas, parametrosValores, parametrosTaxas]);

    const reloadData = useCallback(async (dataType: 'veiculos' | 'cargas' | 'parametrosValores' | 'parametrosTaxas' | 'lancamentos' | 'all') => {
        if (dataType === 'all') {
            await loadInitialData();
            return;
        }
        try {
            setLoading(true);
            switch (dataType) {
                case 'veiculos': setVeiculos(await api.getVeiculos()); break;
                case 'cargas': setCargas(await api.getCargas()); break;
                case 'parametrosValores': setParametrosValores(await api.getParametrosValores()); break;
                case 'parametrosTaxas': setParametrosTaxas(await api.getParametrosTaxas()); break;
                case 'lancamentos': setLancamentos(await api.getLancamentos()); break;
            }
        } catch (err: any) {
            setError(`Falha ao recarregar dados de ${dataType}: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [loadInitialData]);
    
    // --- CRUD Handlers ---

    const addLancamento = async (lancamento: Omit<Lancamento, 'ID_Lancamento'>): Promise<Lancamento> => {
        const newLancamento = await api.createLancamento(lancamento);
        setLancamentos(prev => [...prev, newLancamento]);
        return newLancamento;
    };
    const updateLancamento = async (lancamento: Lancamento): Promise<Lancamento> => {
        const updatedLancamento = await api.updateLancamento(lancamento.ID_Lancamento, lancamento);
        setLancamentos(prev => prev.map(l => l.ID_Lancamento === updatedLancamento.ID_Lancamento ? updatedLancamento : l));
        return updatedLancamento;
    };
    const deleteLancamento = async (id: number, motivo: string) => {
        await api.deleteLancamento(id, motivo);
        const lancamento = lancamentos.find(l => l.ID_Lancamento === id);
        if(lancamento){
             setLancamentos(prev => prev.map(l => l.ID_Lancamento === id ? { ...l, Excluido: true, MotivoExclusao: motivo } : l));
        }
    };
    
    const addVeiculo = async (veiculo: Omit<Veiculo, 'ID_Veiculo'>) => {
        const newVeiculo = await api.createVeiculo(veiculo);
        setVeiculos(prev => [...prev, newVeiculo]);
    };
    const updateVeiculo = async (veiculo: Veiculo) => {
        const updatedVeiculo = await api.updateVeiculo(veiculo.ID_Veiculo, veiculo);
        setVeiculos(prev => prev.map(v => v.ID_Veiculo === updatedVeiculo.ID_Veiculo ? updatedVeiculo : v));
    };

    const addCarga = async (carga: Omit<Carga, 'ID_Carga'>) => {
        const newCarga = await api.createCarga(carga);
        setCargas(prev => [...prev, newCarga]);
    };
    const updateCarga = async (carga: Carga) => {
        const updatedCarga = await api.updateCarga(carga.ID_Carga, carga);
        setCargas(prev => prev.map(c => c.ID_Carga === updatedCarga.ID_Carga ? updatedCarga : c));
    };
    const deleteCarga = async (id: number, motivo: string) => {
        await api.deleteCarga(id, motivo);
        setCargas(prev => prev.map(c => c.ID_Carga === id ? { ...c, Excluido: true, MotivoExclusao: motivo } : c));
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