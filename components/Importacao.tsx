

import React, { useState, useContext, ChangeEvent, useEffect } from 'react';
import { DataContext } from '../context/DataContext.tsx';
import * as api from '../services/apiService.ts';
import { CloudUploadIcon, CheckCircleIcon, XCircleIcon, SpinnerIcon, TruckIcon, ExclamationIcon, DocumentReportIcon } from './icons.tsx';
import { Veiculo, VehicleConflict, CargaCheckResult, CargaReactivation, Carga } from '../types.ts';

type ImportType = 'veiculos' | 'cargas' | 'parametros-valores' | 'parametros-taxas';

interface ImportResult {
    success: boolean;
    message: string;
    count?: number;
    details?: string[];
}

// --- Modal de Resolução de Conflitos (Veículos) ---
const ConflictModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    conflicts: VehicleConflict[];
    newVehiclesCount: number;
    onConfirm: (conflicts: VehicleConflict[]) => void;
}> = ({ isOpen, onClose, conflicts, newVehiclesCount, onConfirm }) => {
    const [localConflicts, setLocalConflicts] = useState<VehicleConflict[]>([]);

    useEffect(() => {
        setLocalConflicts(conflicts);
    }, [conflicts]);

    if (!isOpen) return null;

    const updateAction = (index: number, action: 'overwrite' | 'skip') => {
        setLocalConflicts(prev => {
            const newArr = [...prev];
            newArr[index].action = action;
            return newArr;
        });
    };

    const setAll = (action: 'overwrite' | 'skip') => {
        setLocalConflicts(prev => prev.map(c => ({ ...c, action })));
    };

    const handleConfirm = () => {
        onConfirm(localConflicts);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center">
                        <ExclamationIcon className="w-8 h-8 text-yellow-500 mr-3" />
                        <div>
                            <h2 className="text-xl font-bold text-white">Veículos Duplicados Encontrados</h2>
                            <p className="text-sm text-slate-400">
                                {conflicts.length} veículos já existem no sistema. Escolha se deseja sobrescrever os dados locais com os do ERP.
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose}><XCircleIcon className="w-8 h-8 text-slate-500 hover:text-slate-300" /></button>
                </div>

                <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                    <span className="text-sky-400 font-bold text-sm">Novos veículos a importar automaticamente: {newVehiclesCount}</span>
                    <div className="space-x-3">
                        <button onClick={() => setAll('overwrite')} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded border border-slate-600">Sobrescrever Todos (Sim)</button>
                        <button onClick={() => setAll('skip')} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded border border-slate-600">Manter Locais (Não)</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-700 sticky top-0">
                            <tr>
                                <th className="p-3">Código</th>
                                <th className="p-3">Placa (Local / ERP)</th>
                                <th className="p-3">Tipo (Local / ERP)</th>
                                <th className="p-3 text-center">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {localConflicts.map((conflict, index) => (
                                <tr key={index} className="hover:bg-slate-700/50">
                                    <td className="p-3 font-mono text-white">{conflict.local.COD_Veiculo}</td>
                                    <td className="p-3">
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 text-xs">Local: {conflict.local.Placa}</span>
                                            <span className={`text-xs ${conflict.local.Placa !== conflict.erp.Placa ? 'text-yellow-400 font-bold' : 'text-slate-300'}`}>
                                                ERP: {conflict.erp.Placa}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 text-xs">Local: {conflict.local.TipoVeiculo}</span>
                                            <span className={`text-xs ${conflict.local.TipoVeiculo !== conflict.erp.TipoVeiculo ? 'text-yellow-400 font-bold' : 'text-slate-300'}`}>
                                                ERP: {conflict.erp.TipoVeiculo}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button 
                                                onClick={() => updateAction(index, 'overwrite')} 
                                                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${conflict.action === 'overwrite' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                            >
                                                Sim (Sobrescrever)
                                            </button>
                                            <button 
                                                onClick={() => updateAction(index, 'skip')} 
                                                className={`px-3 py-1 rounded text-xs font-bold transition-colors ${conflict.action === 'skip' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                                            >
                                                Não (Manter)
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-slate-700 flex justify-end space-x-3 bg-slate-800 rounded-b-lg">
                    <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition duration-200">Cancelar</button>
                    <button onClick={handleConfirm} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition duration-200">
                        Confirmar Importação
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Modal de Reativação de Cargas (Importação) ---
const ReactivateCargasModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    deletedCargas: CargaReactivation[];
    newCargasCount: number;
    onConfirm: (selectedToReactivate: CargaReactivation[]) => void;
}> = ({ isOpen, onClose, deletedCargas, newCargasCount, onConfirm }) => {
    const [items, setItems] = useState<CargaReactivation[]>([]);

    useEffect(() => {
        // Marca todos como false por padrão ou true se preferir
        setItems(deletedCargas.map(c => ({ ...c, selected: false })));
    }, [deletedCargas]);

    if (!isOpen) return null;

    const toggleSelection = (index: number) => {
        setItems(prev => {
            const newArr = [...prev];
            newArr[index].selected = !newArr[index].selected;
            return newArr;
        });
    };

    const setAll = (selected: boolean) => {
        setItems(prev => prev.map(c => ({ ...c, selected })));
    };

    const handleConfirm = () => {
        onConfirm(items.filter(c => c.selected));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-700 flex items-center justify-between">
                    <div className="flex items-center">
                        <ExclamationIcon className="w-8 h-8 text-yellow-500 mr-3" />
                        <div>
                            <h2 className="text-xl font-bold text-white">Cargas Excluídas Encontradas</h2>
                            <p className="text-sm text-slate-400">
                                Encontramos {items.length} cargas no ERP que já existiam no sistema mas foram excluídas. Deseja reativá-las?
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose}><XCircleIcon className="w-8 h-8 text-slate-500 hover:text-slate-300" /></button>
                </div>

                <div className="p-4 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                    <span className="text-sky-400 font-bold text-sm">Novas cargas (serão importadas automaticamente): {newCargasCount}</span>
                    <div className="space-x-3">
                        <button onClick={() => setAll(true)} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded border border-slate-600">Marcar Todas</button>
                        <button onClick={() => setAll(false)} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded border border-slate-600">Desmarcar Todas</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <table className="w-full text-sm text-left text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-700 sticky top-0">
                            <tr>
                                <th className="p-3 text-center">Reativar?</th>
                                <th className="p-3">Nº Carga</th>
                                <th className="p-3">Cidade</th>
                                <th className="p-3">Valor ERP</th>
                                <th className="p-3">Motivo Exclusão Anterior</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {items.map((item, index) => (
                                <tr key={index} className={`hover:bg-slate-700/50 cursor-pointer ${item.selected ? 'bg-slate-700/30' : ''}`} onClick={() => toggleSelection(index)}>
                                    <td className="p-3 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={item.selected} 
                                            onChange={() => {}} // Handled by Row Click
                                            className="w-4 h-4 text-sky-600 bg-slate-700 border-slate-500 rounded focus:ring-sky-500"
                                        />
                                    </td>
                                    <td className="p-3 font-medium text-white">{item.erp.NumeroCarga}</td>
                                    <td className="p-3">{item.erp.Cidade}</td>
                                    <td className="p-3 font-mono">{item.erp.ValorCTE.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                    <td className="p-3 text-red-300 text-xs italic">{item.motivoExclusao || 'Sem motivo'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 border-t border-slate-700 flex justify-end space-x-3 bg-slate-800 rounded-b-lg">
                    <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition duration-200">Cancelar</button>
                    <button onClick={handleConfirm} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md transition duration-200">
                        Confirmar e Importar
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Card para Importação de Veículos do ERP ---
const ERPVeiculosImportCard: React.FC = () => {
    const { reloadData } = useContext(DataContext);
    const [isChecking, setIsChecking] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    
    const [conflictData, setConflictData] = useState<{ conflicts: VehicleConflict[], newVehicles: Veiculo[] } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCheck = async () => {
        setIsChecking(true);
        setResult(null);
        try {
            const checkResult = await api.checkVeiculosERP();
            
            if (checkResult.newVehicles.length === 0 && checkResult.conflicts.length === 0) {
                setResult({ success: true, message: "O sistema já está sincronizado. Nenhum veículo novo ou alterado encontrado." });
                return;
            }

            // Se houver conflitos, abre modal. Se só houver novos, importa direto (mas vamos usar a mesma lógica de confirmação para consistência ou auto-importar)
            if (checkResult.conflicts.length > 0) {
                setConflictData({ conflicts: checkResult.conflicts, newVehicles: checkResult.newVehicles });
                setIsModalOpen(true);
            } else {
                // Apenas novos veículos, sem conflitos.
                await executeSync(checkResult.newVehicles, []);
            }

        } catch (error: any) {
            setResult({ success: false, message: error.message || "Erro ao verificar veículos no ERP." });
        } finally {
            setIsChecking(false);
        }
    };

    const executeSync = async (newVehicles: Veiculo[], vehiclesToUpdate: Veiculo[]) => {
        setIsSyncing(true);
        try {
            const syncResult = await api.syncVeiculosERP(newVehicles, vehiclesToUpdate);
            setResult({ success: true, message: syncResult.message, count: syncResult.count });
            await reloadData('veiculos');
            setIsModalOpen(false);
            setConflictData(null);
        } catch (error: any) {
            setResult({ success: false, message: error.message || "Erro ao sincronizar veículos." });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleModalConfirm = (resolvedConflicts: VehicleConflict[]) => {
        if (!conflictData) return;
        
        const vehiclesToUpdate = resolvedConflicts
            .filter(c => c.action === 'overwrite')
            .map(c => c.erp);
        
        executeSync(conflictData.newVehicles, vehiclesToUpdate);
    };

    return (
        <>
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-sky-500/30">
                 <div className="flex items-center mb-4">
                    <TruckIcon className="w-8 h-8 text-sky-400 mr-4" />
                    <div>
                        <h3 className="text-lg font-semibold text-white">Sincronizar Veículos do ERP</h3>
                        <p className="text-sm text-slate-400">Atualize sua frota buscando novos cadastros e alterações diretamente do ERP.</p>
                    </div>
                </div>
                <div className="mt-4">
                    <button 
                        onClick={handleCheck}
                        disabled={isChecking || isSyncing}
                        className="bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-md transition duration-200 w-full sm:w-auto inline-flex items-center justify-center"
                    >
                        {isChecking || isSyncing ? <SpinnerIcon className="w-5 h-5 mr-2" /> : null}
                        {isChecking ? 'Verificando...' : (isSyncing ? 'Sincronizando...' : 'Verificar Atualizações')}
                    </button>
                </div>
                {result && (
                    <div className={`mt-4 p-3 rounded-md text-sm flex items-center ${result.success ? 'bg-green-900/50 text-green-200 border border-green-700/50' : 'bg-red-900/50 text-red-200 border border-red-700/50'}`}>
                        {result.success ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <XCircleIcon className="w-5 h-5 mr-2" />}
                        {result.message}
                    </div>
                )}
            </div>

            {conflictData && (
                <ConflictModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    conflicts={conflictData.conflicts}
                    newVehiclesCount={conflictData.newVehicles.length}
                    onConfirm={handleModalConfirm}
                />
            )}
        </>
    );
};


// --- Card para Importação do ERP (Cargas) - Refatorado para Fluxo Check/Sync ---
const ERPImportCard: React.FC = () => {
    const { reloadData } = useContext(DataContext);
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    
    const [result, setResult] = useState<ImportResult | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Estado para Reativação
    const [checkResult, setCheckResult] = useState<CargaCheckResult | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    const handleCheck = async () => {
        setResult(null);

        // Validação de Período (Máximo 45 dias)
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 45) {
            setResult({ 
                success: false, 
                message: `O período selecionado (${diffDays} dias) excede o limite máximo de 45 dias. Por favor, selecione um intervalo menor.` 
            });
            return;
        }

        setIsChecking(true);
        setCheckResult(null);

        try {
            const checkData = await api.checkCargasERP(startDate, endDate);
            
            // Caso 1: Veículos Faltantes
            if (checkData.missingVehicles.length > 0) {
                setResult({ 
                    success: false, 
                    message: `Não foi possível importar. Veículos não cadastrados: ${checkData.missingVehicles.slice(0, 5).join(', ')}${checkData.missingVehicles.length > 5 ? '...' : ''}. Cadastre-os primeiro.`
                });
                return;
            }

            // Caso 2: Nada novo, nada excluído
            if (checkData.newCargas.length === 0 && checkData.deletedCargas.length === 0) {
                setResult({ success: true, message: checkData.message || "Nenhuma carga nova ou alteração encontrada." });
                return;
            }

            // Caso 3: Tem cargas excluídas -> Abre Modal
            if (checkData.deletedCargas.length > 0) {
                setCheckResult(checkData);
                setIsModalOpen(true);
                return;
            }

            // Caso 4: Só tem cargas novas -> Sincroniza direto
            if (checkData.newCargas.length > 0) {
                await executeSync(checkData.newCargas, []);
            }

        } catch (error: any) {
            setResult({ success: false, message: error.message || 'Falha na verificação.' });
        } finally {
            setIsChecking(false);
        }
    };

    const executeSync = async (newCargas: any[], cargasToReactivate: any[]) => {
        setIsSyncing(true);
        try {
            const syncRes = await api.syncCargasERP(newCargas, cargasToReactivate);
            setResult({ 
                success: true, 
                message: `Sincronização concluída! ${syncRes.count} cargas processadas (Novas/Atualizadas).`, 
                count: syncRes.count 
            });
            await reloadData('cargas');
            setIsModalOpen(false);
            setCheckResult(null);
        } catch (error: any) {
            setResult({ success: false, message: error.message || "Erro na sincronização." });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleModalConfirm = (selectedToReactivate: CargaReactivation[]) => {
        if (!checkResult) return;
        const cargasToReactivate = selectedToReactivate.map(r => r.erp); // Envia os dados novos do ERP para atualizar
        executeSync(checkResult.newCargas, cargasToReactivate);
    };

    return (
        <>
            <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-sky-500/30">
                <div className="flex items-center mb-4">
                    <TruckIcon className="w-8 h-8 text-sky-400 mr-4" />
                    <div>
                        <h3 className="text-lg font-semibold text-white">Importar Cargas do ERP</h3>
                        <p className="text-sm text-slate-400">Busque novas cargas e verifique reativações necessárias.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end mt-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-1">Data Início</label>
                        <input type="date" name="startDate" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 text-sm focus:ring-sky-500 focus:border-sky-500" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-1">Data Fim</label>
                        <input type="date" name="endDate" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 text-sm focus:ring-sky-500 focus:border-sky-500" />
                    </div>
                     <button 
                        onClick={handleCheck}
                        disabled={isChecking || isSyncing}
                        className="bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition duration-200 w-full inline-flex items-center justify-center"
                     >
                         {isChecking || isSyncing ? (
                            <>
                                <SpinnerIcon className="w-5 h-5 mr-2" />
                                <span>{isChecking ? 'Verificando...' : 'Sincronizando...'}</span>
                            </>
                        ) : (
                           <span>Buscar Cargas</span>
                        )}
                     </button>
                </div>
                 {result && (
                    <div className={`mt-4 p-3 rounded-md text-sm flex items-center ${result.success ? 'bg-green-900/50 text-green-200 border border-green-700/50' : 'bg-red-900/50 text-red-200 border border-red-700/50'}`}>
                        {result.success ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <XCircleIcon className="w-5 h-5 mr-2" />}
                        {result.message}
                    </div>
                )}
            </div>

            {checkResult && (
                <ReactivateCargasModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    deletedCargas={checkResult.deletedCargas}
                    newCargasCount={checkResult.newCargas.length}
                    onConfirm={handleModalConfirm}
                />
            )}
        </>
    );
};

// --- Card para Importação via XML (CT-e) ---
const XMLImportCard: React.FC = () => {
    const { veiculos, cargas, addCarga } = useContext(DataContext);
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);

    const cleanPlate = (plate: string) => plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        setIsProcessing(true);
        setResult(null);
        
        const files = Array.from(e.target.files);
        let successCount = 0;
        let errors: string[] = [];
        const parser = new DOMParser();

        try {
            for (const file of files) {
                try {
                    const text = await file.text();
                    const xmlDoc = parser.parseFromString(text, "text/xml");

                    // Validar se é um CT-e
                    const isCte = xmlDoc.getElementsByTagName("cteProc").length > 0 || xmlDoc.getElementsByTagName("CTe").length > 0;
                    if (!isCte) {
                        errors.push(`${file.name}: Não é um arquivo CT-e válido.`);
                        continue;
                    }

                    // Extração de Dados (Resiliente a Namespaces)
                    const getTag = (tagName: string) => {
                        // Tenta encontrar a tag diretamente
                        let el = xmlDoc.getElementsByTagName(tagName)[0];
                        // Se não achar, tenta encontrar com namespaces comuns (caso o parser não remova)
                        if (!el) el = xmlDoc.getElementsByTagName("infCte")[0]?.getElementsByTagName(tagName)[0];
                        return el ? el.textContent : null;
                    };

                    const nCT = getTag("nCT");
                    const dhEmi = getTag("dhEmi");
                    const vRec = getTag("vRec") || getTag("vTPrest");
                    
                    // Cidade de Destino
                    let xMunFim = null;
                    const destNode = xmlDoc.getElementsByTagName("dest")[0];
                    if (destNode) {
                        const enderDest = destNode.getElementsByTagName("enderDest")[0];
                        if (enderDest) xMunFim = enderDest.getElementsByTagName("xMun")[0]?.textContent;
                    }
                    if (!xMunFim) xMunFim = getTag("xMunFim");

                    // --- Extração Inteligente de Placa/Veículo ---
                    let placa = null;
                    let codigoVeiculoXml = null;

                    // 1. Tenta padrão <rodo> ou <infModal>
                    const rodoNode = xmlDoc.getElementsByTagName("rodo")[0] || xmlDoc.getElementsByTagName("infModal")[0];
                    if (rodoNode) {
                        const veicNode = rodoNode.getElementsByTagName("veic")[0];
                        if (veicNode) placa = veicNode.getElementsByTagName("placa")[0]?.textContent;
                        
                        if (!placa) {
                             const reboqueNode = rodoNode.getElementsByTagName("veicTracionado")[0];
                             if (reboqueNode) placa = reboqueNode.getElementsByTagName("placa")[0]?.textContent;
                        }
                    }

                    // 2. Fallback: Tenta extrair de <ObsCont> (DADOS DO VEICULO)
                    if (!placa) {
                        const obsContNodes = xmlDoc.getElementsByTagName("ObsCont");
                        for (let i = 0; i < obsContNodes.length; i++) {
                            const obs = obsContNodes[i];
                            const xCampo = obs.getAttribute("xCampo");
                            // Verifica "DADOS DO VEICULO" (case insensitive)
                            if (xCampo && xCampo.toUpperCase() === "DADOS DO VEICULO") {
                                const xTexto = obs.getElementsByTagName("xTexto")[0]?.textContent;
                                if (xTexto) {
                                    // Extrai Placa: "Placa: XXX0000"
                                    const plateMatch = xTexto.match(/Placa:\s*([A-Z0-9]+)/i);
                                    if (plateMatch && plateMatch[1]) {
                                        placa = plateMatch[1];
                                    }
                                    // Extrai Codigo: "Codigo: 64"
                                    const codeMatch = xTexto.match(/Codigo:\s*([A-Z0-9]+)/i);
                                    if (codeMatch && codeMatch[1]) {
                                        codigoVeiculoXml = codeMatch[1];
                                    }
                                    break; // Encontrou a tag correta
                                }
                            }
                        }
                    }

                    // Validações Básicas
                    if (!nCT || !dhEmi || !vRec || !xMunFim) {
                        errors.push(`${file.name}: Campos obrigatórios faltando (Número, Data, Valor ou Cidade).`);
                        continue;
                    }

                    // Verificar Duplicidade
                    const exists = cargas.some(c => c.NumeroCarga === nCT && !c.Excluido);
                    if (exists) {
                        errors.push(`${file.name}: Carga ${nCT} já cadastrada.`);
                        continue;
                    }

                    // Tentar encontrar o veículo no sistema
                    let veiculoEncontrado = null;

                    // 1. Busca por Placa (Prioridade)
                    if (placa) {
                        const cleanXmlPlate = cleanPlate(placa);
                        veiculoEncontrado = veiculos.find(v => cleanPlate(v.Placa) === cleanXmlPlate);
                    }

                    // 2. Busca por Código do Veículo (Fallback se tiver extraído do XML)
                    if (!veiculoEncontrado && codigoVeiculoXml) {
                        veiculoEncontrado = veiculos.find(v => v.COD_Veiculo === codigoVeiculoXml);
                    }

                    if (!veiculoEncontrado) {
                        errors.push(`${file.name}: Veículo não identificado no sistema (Placa: ${placa || '?'} / Cód: ${codigoVeiculoXml || '?'}).`);
                        continue;
                    }

                    // Criar Objeto Carga
                    const novaCarga: Omit<Carga, 'ID_Carga'> = {
                        NumeroCarga: nCT,
                        Cidade: xMunFim,
                        ValorCTE: parseFloat(vRec),
                        DataCTE: dhEmi.split('T')[0],
                        KM: 0, 
                        COD_Veiculo: veiculoEncontrado.COD_Veiculo,
                        Origem: 'Manual'
                    };

                    await addCarga(novaCarga);
                    successCount++;

                } catch (err: any) {
                    console.error(err);
                    errors.push(`${file.name}: Erro ao processar - ${err.message}`);
                }
            }

            setResult({
                success: successCount > 0,
                message: `Processamento concluído. ${successCount} cargas importadas.`,
                count: successCount,
                details: errors
            });

        } catch (error: any) {
            setResult({ success: false, message: "Erro geral na importação: " + error.message });
        } finally {
            setIsProcessing(false);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-sky-500/30">
            <div className="flex items-center mb-4">
                <DocumentReportIcon className="w-8 h-8 text-sky-400 mr-4" />
                <div>
                    <h3 className="text-lg font-semibold text-white">Importar XML (CT-e)</h3>
                    <p className="text-sm text-slate-400">Carregue arquivos XML dos conhecimentos para criar as cargas automaticamente.</p>
                </div>
            </div>
            
            <div className="mt-6">
                <label htmlFor="xml-upload" className={`relative cursor-pointer text-white font-bold py-3 px-6 rounded-md transition duration-200 w-full text-center inline-flex items-center justify-center ${isProcessing ? 'bg-slate-500 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-500'}`}>
                    {isProcessing ? (
                        <><SpinnerIcon className="w-5 h-5 mr-2" /><span>Processando XMLs...</span></>
                    ) : (
                       <>
                         <CloudUploadIcon className="w-5 h-5 mr-2" />
                         <span>Selecionar Arquivos XML</span>
                       </>
                    )}
                    <input id="xml-upload" type="file" className="sr-only" accept=".xml" multiple onChange={handleFiles} disabled={isProcessing} />
                </label>
            </div>

            {result && (
                <div className="mt-4 space-y-2">
                    <div className={`p-3 rounded-md text-sm flex items-center ${result.success ? 'bg-green-900/50 text-green-200 border border-green-700/50' : 'bg-red-900/50 text-red-200 border border-red-700/50'}`}>
                        {result.success ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <XCircleIcon className="w-5 h-5 mr-2" />}
                        {result.message}
                    </div>
                    {result.details && result.details.length > 0 && (
                        <div className="bg-slate-900/50 p-3 rounded-md border border-slate-700 max-h-40 overflow-y-auto">
                            <p className="text-xs font-bold text-slate-400 mb-1">Detalhes / Erros:</p>
                            <ul className="list-disc list-inside text-xs text-red-300">
                                {result.details.map((err, idx) => (
                                    <li key={idx}>{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


// --- Card para Importação via CSV ---
const CSVImportCard: React.FC<{
    title: string;
    description: string;
    headers: string;
    importType: ImportType;
}> = ({ title, description, headers, importType }) => {
    const { reloadData } = useContext(DataContext);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setResult(null);
        setIsImporting(true);

        try {
            const apiResult = await api.importData(file, importType);
            setResult({ 
                success: true, 
                message: `${apiResult.message} ${apiResult.count} registros processados.`, 
                count: apiResult.count 
            });
            // Reload relevant data after mock processing
            if (importType === 'veiculos') await reloadData('veiculos');
            else if (importType === 'cargas') await reloadData('cargas');
            else if (importType === 'parametros-valores') await reloadData('parametrosValores');
            else if (importType === 'parametros-taxas') await reloadData('parametrosTaxas');

        } catch (error: any) {
            setResult({ success: false, message: error.message || 'Falha no upload do arquivo.', count: 0 });
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
                <CloudUploadIcon className="w-8 h-8 text-slate-400 mr-4" />
                <div>
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <p className="text-sm text-slate-400">{description}</p>
                </div>
            </div>
            <div className="mt-4 bg-slate-900 p-3 rounded-md">
                <p className="text-xs text-slate-400">Colunas esperadas (CSV):</p>
                <p className="text-xs font-mono text-sky-300 mt-1">{headers}</p>
            </div>
            <div className="mt-6">
                <label htmlFor={`file-upload-${importType}`} className={`relative cursor-pointer text-white font-bold py-2 px-4 rounded-md transition duration-200 w-full text-center inline-flex items-center justify-center ${isImporting ? 'bg-slate-500 cursor-not-allowed' : 'bg-slate-600 hover:bg-slate-500'}`}>
                    {isImporting ? (
                        <><SpinnerIcon className="w-5 h-5 mr-2" /><span>Importando...</span></>
                    ) : (
                       <span>Selecionar Arquivo CSV</span>
                    )}
                    <input id={`file-upload-${importType}`} name={`file-upload-${importType}`} type="file" className="sr-only" accept=".csv" onChange={handleFileChange} disabled={isImporting} />
                </label>
            </div>
            {result && (
                <div className={`mt-4 p-3 rounded-md text-sm flex items-center ${result.success ? 'bg-green-900/50 text-green-200' : 'bg-red-900/50 text-red-200'}`}>
                    {result.success ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <XCircleIcon className="w-5 h-5 mr-2" />}
                    {result.message}
                </div>
            )}
        </div>
    );
};

// --- Componente Principal ---
export const Importacao: React.FC = () => {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Importação de Dados</h2>
                <p className="text-slate-400">Importe cargas do ERP ou carregue outros dados via arquivos XML/CSV.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <XMLImportCard />
                <ERPImportCard />
                <ERPVeiculosImportCard />
            </div>
            
            <div className="border-t border-slate-700 pt-8">
                 <h3 className="text-xl font-bold text-white mb-2">Importação Manual via CSV</h3>
                <p className="text-slate-400 mb-6">Para cadastros em massa, utilize os templates abaixo.</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <CSVImportCard
                        title="Importar Veículos"
                        description="Faça o upload da sua frota de veículos."
                        headers="COD_Veiculo,Placa,TipoVeiculo,Motorista,CapacidadeKG,Ativo"
                        importType="veiculos"
                    />
                     <CSVImportCard
                        title="Importar Cargas Manuais"
                        description="Carregue cargas que não estão no ERP."
                        headers="NumeroCarga,Cidade,ValorCTE,DataCTE,COD_Veiculo"
                        importType="cargas"
                    />
                    <CSVImportCard
                        title="Importar Parâmetros de Valores"
                        description="Defina os valores base por cidade e tipo de veículo."
                        headers="Cidade,TipoVeiculo,ValorBase,KM"
                        importType="parametros-valores"
                    />
                     <CSVImportCard
                        title="Importar Parâmetros de Taxas"
                        description="Defina as taxas (pedágio, balsa, etc.) por cidade."
                        headers="Cidade,Pedagio,Balsa,Ambiental,Chapa,Outras"
                        importType="parametros-taxas"
                    />
                </div>
            </div>
        </div>
    );
};
