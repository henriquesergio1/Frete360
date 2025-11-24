
import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Veiculo, ParametroValor, ParametroTaxa, Carga, Lancamento, NewLancamento, SystemConfig } from '../types.ts';
import * as api from '../services/apiService.ts';

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
    systemConfig: SystemConfig;

    setEditingLancamento: (lancamento: Lancamento | null) => void;
    reloadData: (dataType: 'veiculos' | 'cargas' | 'parametrosValores' | 'parametrosTaxas' | 'lancamentos' | 'all') => Promise<void>;
    updateSystemConfig: (config: SystemConfig) => Promise<void>;
    
    // CRUD operations
    addLancamento: (lancamento: NewLancamento) => Promise<Lancamento>;
    updateLancamento: (lancamento: Lancamento) => Promise<Lancamento>;
    deleteLancamento: (id: number, motivo: string) => Promise<void>;
    
    addVeiculo: (veiculo: Omit<Veiculo, 'ID_Veiculo'>) => Promise<void>;
    updateVeiculo: (veiculo: Veiculo) => Promise<void>;

    addCarga: (carga: Omit<Carga, 'ID_Carga'>) => Promise<void>;
    updateCarga: (carga: Carga) => Promise<void>;
    deleteCarga: (id: number, motivo: string) => Promise<void>;

    addParametroValor: (param: Omit<ParametroValor, 'ID_Parametro'>) => Promise<void>;
    updateParametroValor: (param: ParametroValor) => Promise<void>;
    deleteParametroValor: (id: number, motivo: string) => Promise<void>;
    
    addParametroTaxa: (param: Omit<ParametroTaxa, 'ID_Taxa'>) => Promise<void>;
    updateParametroTaxa: (param: ParametroTaxa) => Promise<void>;
    deleteParametroTaxa: (id: number, motivo: string) => Promise<void>;
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

    // System Config State - Agora carregado da API, mas inicializado vazio
    const [systemConfig, setSystemConfig] = useState<SystemConfig>({ companyName: 'Fretes', logoUrl: '' });

    const updateSystemConfig = useCallback(async (config: SystemConfig) => {
        try {
            // Salva na API
            await api.updateSystemConfig(config);
            // Atualiza estado local
            setSystemConfig(config);
            // Mantém cache no LocalStorage para login rápido (fallback)
            localStorage.setItem('SYSTEM_CONFIG', JSON.stringify(config));
        } catch (e) {
            console.error("Erro ao salvar configurações:", e);
            throw e;
        }
    }, []);

    const loadInitialData = useCallback(async () => {
        try {
            console.log('[DataContext] Iniciando carregamento de dados...');
            setError(null);
            setLoading(true);
            
            const [veiculosData, pValoresData, pTaxasData, cargasManuaisData, lancamentosData, configData] = await Promise.all([
                api.getVeiculos(),
                api.getParametrosValores(),
                api.getParametrosTaxas(),
                api.getCargasManuais(),
                api.getLancamentos(),
                api.getSystemConfig(),
            ]);

            // LOGS DE DIAGNÓSTICO
            console.log('[DataContext] Veículos carregados:', veiculosData ? veiculosData.length : 'NULL');
            console.log('[DataContext] Cargas carregadas:', cargasManuaisData ? cargasManuaisData.length : 'NULL');
            console.log('[DataContext] Config carregada:', configData);

            // Proteção contra null/undefined e atualização de estado
            setVeiculos(Array.isArray(veiculosData) ? veiculosData : []);
            setParametrosValores(Array.isArray(pValoresData) ? pValoresData : []);
            setParametrosTaxas(Array.isArray(pTaxasData) ? pTaxasData : []);
            setCargas(Array.isArray(cargasManuaisData) ? cargasManuaisData : []);
            setLancamentos(Array.isArray(lancamentosData) ? lancamentosData : []);
            
            if (configData) {
                setSystemConfig(configData);
                localStorage.setItem('SYSTEM_CONFIG', JSON.stringify(configData));
            }
            
        } catch (err: any) {
            console.error("Erro crítico ao carregar dados:", err);
            // Verificação segura de ambiente (NÃO USAR process.env aqui)
            const isApiMode = window.__FRETE_MODO_MOCK__ === false;
            let errorMessage = `Falha crítica no carregamento de dados: ${err.message}`;
            
            if (isApiMode && err.message && err.message.includes('Invalid column name')) {
                errorMessage += " (ERRO DE BANCO: Parece que o banco de dados está desatualizado. Rode o script database_schema.txt).";
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        const allTipos = [...new Set([
            ...veiculos.map(v => v.TipoVeiculo),
            ...parametrosValores.map(p => p.TipoVeiculo)
        ])].filter(Boolean).sort();

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
            switch (dataType) {
                case 'veiculos': setVeiculos(await api.getVeiculos() || []); break;
                case 'cargas': setCargas(await api.getCargasManuais() || []); break;
                case 'parametrosValores': setParametrosValores(await api.getParametrosValores() || []); break;
                case 'parametrosTaxas': setParametrosTaxas(await api.getParametrosTaxas() || []); break;
                case 'lancamentos': setLancamentos(await api.getLancamentos() || []); break;
            }
        } catch (err: any) {
            setError(`Falha ao recarregar dados de ${dataType}: ${err.message}`);
        }
    }, [loadInitialData]);
    
    // --- CRUD Handlers with Optimistic Updates ---

    const addLancamento = async (lancamento: NewLancamento): Promise<Lancamento> => {
        const newLancamento = await api.createLancamento(lancamento);
        setLancamentos(prev => [...prev, newLancamento]);
        return newLancamento;
    };

    const updateLancamento = async (lancamento: Lancamento): Promise<Lancamento> => {
        const newLancamentoData: NewLancamento = { ...lancamento };
        const createdLancamento = await api.createLancamento(newLancamentoData);
        await api.deleteLancamento(lancamento.ID_Lancamento, lancamento.Motivo || 'Substituição por edição.');
        
        setLancamentos(prev => {
            const updatedList = prev.map(l => 
                l.ID_Lancamento === lancamento.ID_Lancamento 
                    ? { ...l, Excluido: true, MotivoExclusao: lancamento.Motivo || 'Substituição por edição.' } 
                    : l
            );
            updatedList.push(createdLancamento);
            return updatedList;
        });
        return createdLancamento;
    };

    const deleteLancamento = async (id: number, motivo: string) => {
        await api.deleteLancamento(id, motivo);
        setLancamentos(prev => prev.map(l => 
            l.ID_Lancamento === id 
            ? { ...l, Excluido: true, MotivoExclusao: motivo } 
            : l
        ));
    };
    
    const addVeiculo = async (veiculo: Omit<Veiculo, 'ID_Veiculo'>) => {
        const newVeiculo = await api.createVeiculo(veiculo);
        setVeiculos(prev => [...prev, newVeiculo]);
    };
    const updateVeiculo = async (veiculo: Veiculo) => {
        const updatedVeiculo = await api.updateVeiculo(veiculo.ID_Veiculo, veiculo);
        setVeiculos(prev => prev.map(v => v.ID_Veiculo === veiculo.ID_Veiculo ? updatedVeiculo : v));
    };

    const addCarga = async (carga: Omit<Carga, 'ID_Carga'>) => {
        const cargaComOrigem = { ...carga, Origem: carga.Origem || 'Manual' } as Omit<Carga, 'ID_Carga'>;
        const newCarga = await api.createCarga(cargaComOrigem);
        setCargas(prev => [...prev, newCarga]);
    };
    const updateCarga = async (carga: Carga) => {
        const updatedCarga = await api.updateCarga(carga.ID_Carga, carga);
        setCargas(prev => prev.map(c => c.ID_Carga === carga.ID_Carga ? updatedCarga : c));
    };
    const deleteCarga = async (id: number, motivo: string) => {
        await api.deleteCarga(id, motivo);
        setCargas(prev => prev.map(c => c.ID_Carga === id ? { ...c, Excluido: true, MotivoExclusao: motivo } : c));
    };

    const addParametroValor = async (param: Omit<ParametroValor, 'ID_Parametro'>) => {
        const newParam = await api.createParametroValor(param);
        setParametrosValores(prev => [...prev, newParam]);
    };
    const updateParametroValor = async (param: ParametroValor) => {
        const updatedParam = await api.updateParametroValor(param.ID_Parametro, param);
        setParametrosValores(prev => prev.map(p => p.ID_Parametro === param.ID_Parametro ? updatedParam : p));
    };
    const deleteParametroValor = async (id: number, motivo: string) => {
        await api.deleteParametroValor(id, motivo);
        setParametrosValores(prev => prev.filter(p => p.ID_Parametro !== id));
    };

    const addParametroTaxa = async (param: Omit<ParametroTaxa, 'ID_Taxa'>) => {
        const newParam = await api.createParametroTaxa(param);
        setParametrosTaxas(prev => [...prev, newParam]);
    };
    const updateParametroTaxa = async (param: ParametroTaxa) => {
        const updatedParam = await api.updateParametroTaxa(param.ID_Taxa, param);
        setParametrosTaxas(prev => prev.map(p => p.ID_Taxa === param.ID_Taxa ? updatedParam : p));
    };
    const deleteParametroTaxa = async (id: number, motivo: string) => {
        await api.deleteParametroTaxa(id, motivo);
        setParametrosTaxas(prev => prev.filter(p => p.ID_Taxa !== id));
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
            systemConfig,
            setEditingLancamento,
            reloadData,
            updateSystemConfig,
            addLancamento,
            updateLancamento,
            deleteLancamento,
            addVeiculo,
            updateVeiculo,
            addCarga,
            updateCarga,
            deleteCarga,
            addParametroValor,
            updateParametroValor,
            deleteParametroValor,
            addParametroTaxa,
            updateParametroTaxa,
            deleteParametroTaxa
        }}>
            {children}
        </DataContext.Provider>
    );
};
