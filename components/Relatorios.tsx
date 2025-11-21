
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { DataContext } from '../context/DataContext.tsx';
import { Lancamento, Veiculo } from '../types.ts';
import { PencilIcon, ChevronDownIcon, ChevronUpIcon, TrashIcon, ExclamationIcon, ChartBarIcon, DocumentReportIcon, TruckIcon, PrinterIcon, XCircleIcon } from './icons.tsx';

interface RelatoriosProps {
    setView: (view: 'lancamento') => void;
}

interface AnalyticalData {
    veiculoId: number;
    veiculo: Veiculo | undefined;
    count: number;
    receitaTotal: number;
    custoTotal: number;
    totalPedagio: number;
    totalChapa: number;
    totalOutras: number; // Balsa + Ambiental + Outras
    lancamentos: Lancamento[];
}

const initialFilters = {
    startDate: '',
    endDate: '',
    veiculoId: 'all',
};

// --- Modal Component for Deletion ---
const DeletionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (motivo: string) => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    const [motivo, setMotivo] = useState('');

    useEffect(() => {
        if (isOpen) {
            setMotivo(''); // Reset motivo when modal opens
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (motivo.trim()) {
            onConfirm(motivo);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex items-start mb-4">
                    <ExclamationIcon className="w-8 h-8 text-yellow-400 mr-3 shrink-0" />
                    <div>
                        <h2 className="text-xl font-bold text-white">Confirmar Exclusão</h2>
                        <p className="text-slate-300 mt-1">Este lançamento será removido dos relatórios. Por favor, informe o motivo da exclusão para fins de auditoria.</p>
                    </div>
                </div>
                <textarea
                    className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 focus:ring-red-500 focus:border-red-500"
                    rows={3}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Digite o motivo da exclusão..."
                />
                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition duration-200">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!motivo.trim()}
                        className="bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition duration-200"
                    >
                        Excluir Lançamento
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Recibo/Termo de Aceite para Impressão ---
const ReciboPagamento: React.FC<{
    data: AnalyticalData;
    periodo: { start: string, end: string };
    onClose: () => void;
}> = ({ data, periodo, onClose }) => {
    const { systemConfig } = useContext(DataContext);

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatDate = (dateStr: string) => new Date(dateStr.split('T')[0] + 'T00:00:00').toLocaleDateString('pt-BR');

    return (
        <div className="fixed inset-0 z-[100] bg-white text-black overflow-auto flex flex-col">
            {/* Controles de Tela (Escondidos na Impressão) */}
            <div className="bg-slate-800 p-4 flex justify-between items-center print:hidden sticky top-0 z-50 shadow-md">
                <h2 className="text-white font-bold text-lg">Pré-visualização de Recibo</h2>
                <div className="space-x-4">
                    <button onClick={handlePrint} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded flex items-center inline-flex">
                        <PrinterIcon className="w-5 h-5 mr-2"/> Imprimir
                    </button>
                    <button onClick={onClose} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded flex items-center inline-flex">
                        <XCircleIcon className="w-5 h-5 mr-2"/> Fechar
                    </button>
                </div>
            </div>

            {/* Área de Impressão */}
            <div className="p-8 max-w-4xl mx-auto w-full flex-1 print:p-0 print:max-w-none">
                <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold uppercase">{systemConfig.companyName || 'Empresa de Transportes'}</h1>
                        <p className="text-sm mt-1">Recibo de Pagamento de Frete / Termo de Aceite</p>
                    </div>
                    <div className="text-right text-sm">
                        <p><strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                        <p><strong>Período:</strong> {periodo.start ? formatDate(periodo.start) : 'Início'} a {periodo.end ? formatDate(periodo.end) : 'Presente'}</p>
                    </div>
                </div>

                <div className="mb-6 bg-gray-100 p-4 rounded border border-gray-300 print:bg-transparent print:border-black">
                    <h3 className="font-bold text-lg mb-2 border-b border-gray-300 pb-1">Dados do Prestador</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <p><strong>Motorista:</strong> {data.veiculo?.Motorista}</p>
                        <p><strong>Veículo:</strong> {data.veiculo?.TipoVeiculo}</p>
                        <p><strong>Placa:</strong> {data.veiculo?.Placa}</p>
                        <p><strong>CPF/CNPJ:</strong> _______________________</p>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="font-bold text-lg mb-2 border-b border-black pb-1">Detalhamento de Viagens</h3>
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-black text-left">
                                <th className="py-2">Data</th>
                                <th className="py-2">Rota / Cidades</th>
                                <th className="py-2 text-center">Cargas</th>
                                <th className="py-2 text-right">Valor Base</th>
                                <th className="py-2 text-right">Adicionais*</th>
                                <th className="py-2 text-right">Total Frete</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.lancamentos.map((lanc, idx) => {
                                const uniqueCidades = [...new Set(lanc.Cargas.map(c => c.Cidade))].join(', ');
                                const cargasIds = lanc.Cargas.map(c => c.NumeroCarga).join(', ');
                                // Adicionais = Pedagio + Chapa + Outras (Balsa, Ambiental, Outras)
                                const adicionais = lanc.Calculo.Pedagio + lanc.Calculo.Chapa + lanc.Calculo.Balsa + lanc.Calculo.Ambiental + lanc.Calculo.Outras;

                                return (
                                    <tr key={idx} className="border-b border-gray-300 print:border-gray-400">
                                        <td className="py-2">{formatDate(lanc.DataFrete)}</td>
                                        <td className="py-2">{uniqueCidades}</td>
                                        <td className="py-2 text-center text-xs">{cargasIds}</td>
                                        <td className="py-2 text-right">{formatCurrency(lanc.Calculo.ValorBase)}</td>
                                        <td className="py-2 text-right">{formatCurrency(adicionais)}</td>
                                        <td className="py-2 text-right font-bold">{formatCurrency(lanc.Calculo.ValorTotal)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <p className="text-xs mt-1 text-gray-500">* Adicionais incluem: Pedágio, Chapa, Balsa, Taxa Ambiental e Outros.</p>
                </div>

                <div className="mb-8">
                    <h3 className="font-bold text-lg mb-2 border-b border-black pb-1">Resumo Financeiro</h3>
                    <div className="flex justify-end">
                        <table className="w-1/2 text-sm border border-black">
                            <tbody>
                                <tr>
                                    <td className="p-2 border-b border-gray-300">Total Frete Base</td>
                                    <td className="p-2 text-right border-b border-gray-300 font-mono">{formatCurrency(data.lancamentos.reduce((acc, l) => acc + l.Calculo.ValorBase, 0))}</td>
                                </tr>
                                <tr>
                                    <td className="p-2 border-b border-gray-300">Total Pedágio</td>
                                    <td className="p-2 text-right border-b border-gray-300 font-mono">{formatCurrency(data.totalPedagio)}</td>
                                </tr>
                                <tr>
                                    <td className="p-2 border-b border-gray-300">Total Chapa</td>
                                    <td className="p-2 text-right border-b border-gray-300 font-mono">{formatCurrency(data.totalChapa)}</td>
                                </tr>
                                <tr>
                                    <td className="p-2 border-b border-black">Outros Reembolsos</td>
                                    <td className="p-2 text-right border-b border-black font-mono">{formatCurrency(data.totalOutras)}</td>
                                </tr>
                                <tr className="bg-gray-200 print:bg-gray-200">
                                    <td className="p-3 font-bold text-base">VALOR TOTAL A PAGAR</td>
                                    <td className="p-3 text-right font-bold text-base font-mono">{formatCurrency(data.custoTotal)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-12 pt-4 border-t border-black">
                    <p className="text-justify text-sm mb-12">
                        Declaro para os devidos fins que prestei os serviços de transporte acima relacionados e recebi/receberei a importância líquida descrita neste demonstrativo, dando plena e geral quitação pelos serviços realizados no período.
                    </p>
                    
                    <div className="flex justify-between mt-16 gap-10">
                         <div className="text-center flex-1">
                            <div className="border-t border-black w-full pt-2"></div>
                            <p className="font-bold">{systemConfig.companyName}</p>
                            <p className="text-xs">Assinatura Responsável</p>
                        </div>
                        <div className="text-center flex-1">
                            <div className="border-t border-black w-full pt-2"></div>
                            <p className="font-bold">{data.veiculo?.Motorista}</p>
                            <p className="text-xs">Assinatura Motorista</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Relatorios: React.FC<RelatoriosProps> = ({ setView }) => {
    const { lancamentos, deleteLancamento, veiculos, setEditingLancamento } = useContext(DataContext);
    const [activeTab, setActiveTab] = useState<'geral' | 'analitico'>('geral');
    const [filters, setFilters] = useState(initialFilters);
    const [expandedRows, setExpandedRows] = useState<number[]>([]); // Used for both tables
    const [showOnlyExcluded, setShowOnlyExcluded] = useState(false);
    
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [lancamentoToDelete, setLancamentoToDelete] = useState<Lancamento | null>(null);

    const [filteredLancamentos, setFilteredLancamentos] = useState<Lancamento[]>([]);
    
    // Estado para Impressão
    const [printData, setPrintData] = useState<AnalyticalData | null>(null);

    useEffect(() => {
        let result = lancamentos;
        
        // Filtro de Excluídos (Geralmente não queremos excluídos no analítico financeiro, mas respeitamos a flag)
        result = result.filter(l => showOnlyExcluded ? l.Excluido : !l.Excluido);

        if (filters.startDate) {
            result = result.filter(l => new Date(l.DataFrete) >= new Date(filters.startDate + 'T00:00:00'));
        }
        if (filters.endDate) {
            result = result.filter(l => new Date(l.DataFrete) <= new Date(filters.endDate + 'T00:00:00'));
        }
        if (filters.veiculoId !== 'all') {
            result = result.filter(l => l.ID_Veiculo === Number(filters.veiculoId));
        }

        setFilteredLancamentos(result);
        setExpandedRows([]); // Reset expansion when filters change
    }, [filters, showOnlyExcluded, lancamentos]);


    // --- Lógica de Agregação para o Relatório Analítico ---
    const analyticalData = useMemo(() => {
        const grouped = new Map<number, AnalyticalData>();

        filteredLancamentos.forEach(lancamento => {
            const vId = lancamento.ID_Veiculo;
            if (!grouped.has(vId)) {
                grouped.set(vId, {
                    veiculoId: vId,
                    veiculo: veiculos.find(v => v.ID_Veiculo === vId),
                    count: 0,
                    receitaTotal: 0,
                    custoTotal: 0,
                    totalPedagio: 0,
                    totalChapa: 0,
                    totalOutras: 0,
                    lancamentos: []
                });
            }
            
            const group = grouped.get(vId)!;
            
            // Receita: Soma dos valores das Cargas (CTEs)
            const receita = lancamento.Cargas.reduce((sum, c) => sum + c.ValorCTE, 0);
            
            // Custo: Valor Total do Frete Pago
            const custo = lancamento.Calculo.ValorTotal;

            group.count++;
            group.receitaTotal += receita;
            group.custoTotal += custo;
            group.totalPedagio += lancamento.Calculo.Pedagio;
            group.totalChapa += lancamento.Calculo.Chapa;
            group.totalOutras += (lancamento.Calculo.Balsa + lancamento.Calculo.Ambiental + lancamento.Calculo.Outras);
            group.lancamentos.push(lancamento);
        });

        // Retorna array ordenado por Nome do Motorista
        return Array.from(grouped.values()).sort((a, b) => 
            (a.veiculo?.Motorista || '').localeCompare(b.veiculo?.Motorista || '')
        );

    }, [filteredLancamentos, veiculos]);


    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const clearFilters = () => {
        setFilters(initialFilters);
        setShowOnlyExcluded(false);
    };

    const getVeiculoInfo = (id: number): Veiculo | undefined => {
        return veiculos.find(v => v.ID_Veiculo === id);
    };

    const handleEdit = (e: React.MouseEvent, lancamento: Lancamento) => {
        e.stopPropagation();
        setEditingLancamento(lancamento);
        setView('lancamento');
    };

    const toggleRow = (index: number) => {
        setExpandedRows(prev => 
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleDeleteClick = (e: React.MouseEvent, lancamento: Lancamento) => {
        e.stopPropagation();
        setLancamentoToDelete(lancamento);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setLancamentoToDelete(null);
    };

    const handleConfirmDelete = async (motivo: string) => {
        if (!lancamentoToDelete) return;
        try {
            await deleteLancamento(lancamentoToDelete.ID_Lancamento, motivo);
        } catch(error) {
            alert("Falha ao excluir lançamento: " + error);
        } finally {
            handleCloseDeleteModal();
        }
    };
    
    const handlePrintClick = (e: React.MouseEvent, data: AnalyticalData) => {
        e.stopPropagation();
        setPrintData(data);
    };

    const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <div className="space-y-6">
            <DeletionModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
            />
            
            {printData && (
                <ReciboPagamento 
                    data={printData} 
                    periodo={{ start: filters.startDate, end: filters.endDate }}
                    onClose={() => setPrintData(null)} 
                />
            )}

            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Relatórios Gerenciais</h2>
                <p className="text-slate-400">Analise os lançamentos de frete e o desempenho financeiro da frota.</p>
            </div>

            {/* Filter Section */}
            <div className="bg-slate-800 p-4 rounded-lg shadow-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-slate-300 mb-1">Data Início</label>
                        <input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 text-sm focus:ring-sky-500 focus:border-sky-500" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-1">Data Fim</label>
                        <input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 text-sm focus:ring-sky-500 focus:border-sky-500" />
                    </div>
                    <div>
                        <label htmlFor="veiculoId" className="block text-sm font-medium text-slate-300 mb-1">Veículo</label>
                        <select name="veiculoId" id="veiculoId" value={filters.veiculoId} onChange={handleFilterChange} className="w-full bg-slate-700 text-white border border-slate-600 rounded-md p-2 text-sm focus:ring-sky-500 focus:border-sky-500">
                            <option value="all">Todos os Veículos</option>
                            {veiculos.map(v => <option key={v.ID_Veiculo} value={v.ID_Veiculo}>{v.Placa} - {v.Motorista}</option>)}
                        </select>
                    </div>
                    <div>
                         <div className="flex items-center mb-2">
                            <input 
                                type="checkbox" 
                                id="showOnlyExcluded" 
                                checked={showOnlyExcluded} 
                                onChange={(e) => setShowOnlyExcluded(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-500 bg-slate-700 text-sky-600 focus:ring-sky-500"
                            />
                            <label htmlFor="showOnlyExcluded" className="ml-2 text-sm text-slate-300">
                                Exibir apenas excluídos
                            </label>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={clearFilters} className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition duration-200 text-sm">Limpar</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex space-x-1 border-b border-slate-700">
                <button
                    onClick={() => { setActiveTab('geral'); setExpandedRows([]); }}
                    className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center ${
                        activeTab === 'geral'
                            ? 'bg-slate-800 text-sky-400 border-t border-l border-r border-slate-700'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                    <DocumentReportIcon className="w-5 h-5 mr-2" />
                    Geral (Lançamentos)
                </button>
                <button
                    onClick={() => { setActiveTab('analitico'); setExpandedRows([]); }}
                    className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-colors flex items-center ${
                        activeTab === 'analitico'
                            ? 'bg-slate-800 text-sky-400 border-t border-l border-r border-slate-700'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                    <ChartBarIcon className="w-5 h-5 mr-2" />
                    Analítico (Por Veículo)
                </button>
            </div>

            {/* TAB CONTENT: GERAL */}
            {activeTab === 'geral' && (
                <div className="bg-slate-800 rounded-b-lg shadow-lg overflow-hidden border border-t-0 border-slate-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-300">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-700">
                                <tr>
                                    <th scope="col" className="p-4 w-12"><span className="sr-only">Expandir</span></th>
                                    <th scope="col" className="p-4">Data Frete</th>
                                    <th scope="col" className="p-4">Veículo</th>
                                    <th scope="col" className="p-4">Motorista</th>
                                    <th scope="col" className="p-4">Cidades</th>
                                    <th scope="col" className="p-4">Valor Total</th>
                                    <th scope="col" className="p-4">
                                        {showOnlyExcluded ? 'Motivo Exclusão' : 'Motivo Subst.'}
                                    </th>
                                    <th scope="col" className="p-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLancamentos.map((lancamento, index) => {
                                    const veiculo = getVeiculoInfo(lancamento.ID_Veiculo);
                                    const uniqueCidades = [...new Set(lancamento.Cargas.map(c => c.Cidade))];
                                    const cidadesDisplay = uniqueCidades.join(', ');
                                    const isExpanded = expandedRows.includes(index);
                                    const rowClasses = showOnlyExcluded
                                        ? "bg-red-900/10 hover:bg-red-900/20 cursor-pointer"
                                        : "bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer";
                                    const cleanDate = String(lancamento.DataFrete).split('T')[0];

                                    return (
                                        <React.Fragment key={lancamento.ID_Lancamento}>
                                            <tr className={rowClasses} onClick={() => toggleRow(index)}>
                                                <td className="p-4 text-center">
                                                    <button className="text-slate-400">
                                                        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                                    </button>
                                                </td>
                                                <td className="p-4 whitespace-nowrap">{new Date(cleanDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                                <td className="p-4 font-medium text-white whitespace-nowrap">{veiculo?.Placa || 'N/A'}</td>
                                                <td className="p-4">{veiculo?.Motorista || 'N/A'}</td>
                                                <td className="p-4 max-w-xs truncate" title={cidadesDisplay}>{cidadesDisplay}</td>
                                                <td className="p-4 font-mono text-green-400 whitespace-nowrap">{formatCurrency(lancamento.Calculo.ValorTotal)}</td>
                                                <td className="p-4">
                                                    {showOnlyExcluded ? (
                                                         lancamento.MotivoExclusao && (
                                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-300">
                                                                {lancamento.MotivoExclusao}
                                                            </span>
                                                        )
                                                    ) : (
                                                        lancamento.Motivo && (
                                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-300">
                                                                {lancamento.Motivo}
                                                            </span>
                                                        )
                                                    )}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-4">
                                                        <button onClick={(e) => handleEdit(e, lancamento)} disabled={showOnlyExcluded} className="text-sky-400 hover:text-sky-300 disabled:text-slate-600 disabled:cursor-not-allowed" title="Editar Lançamento">
                                                            <PencilIcon className="w-5 h-5"/>
                                                        </button>
                                                        <button onClick={(e) => handleDeleteClick(e, lancamento)} disabled={showOnlyExcluded} className="text-red-400 hover:text-red-300 disabled:text-slate-600 disabled:cursor-not-allowed" title="Excluir Lançamento">
                                                            <TrashIcon className="w-5 h-5"/>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className={showOnlyExcluded ? 'bg-red-900/10' : 'bg-slate-900/50'}>
                                                    <td colSpan={8} className="p-0">
                                                        <div className="p-4 m-4 bg-slate-800/50 rounded-md border border-slate-700">
                                                            <h4 className="text-md font-semibold text-slate-300 mb-3">Detalhes das Cargas</h4>
                                                            <table className="w-full text-sm">
                                                                <thead className="text-xs text-slate-400 uppercase">
                                                                    <tr>
                                                                        <th className="p-2 text-left">Nº Carga</th>
                                                                        <th className="p-2 text-left">Cidade</th>
                                                                        <th className="p-2 text-right">Valor CTE</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {lancamento.Cargas.map(carga => (
                                                                        <tr key={carga.ID_Carga} className="border-t border-slate-700">
                                                                            <td className="p-2 font-medium text-white">{carga.NumeroCarga}</td>
                                                                            <td className="p-2">{carga.Cidade}</td>
                                                                            <td className="p-2 text-right font-mono text-green-300">{formatCurrency(carga.ValorCTE)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filteredLancamentos.length === 0 && (
                        <div className="text-center p-8 text-slate-400">
                            Nenhum lançamento encontrado para os filtros aplicados.
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT: ANALÍTICO */}
            {activeTab === 'analitico' && (
                <div className="bg-slate-800 rounded-b-lg shadow-lg overflow-hidden border border-t-0 border-slate-700">
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-300">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-700">
                                <tr>
                                    <th className="p-4 w-12"></th>
                                    <th className="p-4">Veículo / Motorista</th>
                                    <th className="p-4 text-center">Qtd. Fretes</th>
                                    <th className="p-4 text-right text-green-300">Total Receita (CTE)</th>
                                    <th className="p-4 text-right text-orange-300">Total Custo (Frete)</th>
                                    <th className="p-4 text-right">Pedágio</th>
                                    <th className="p-4 text-right">Chapa</th>
                                    <th className="p-4 text-right" title="Balsa + Ambiental + Outras">Outras Taxas</th>
                                    <th className="p-4 text-right">Resultado</th>
                                    <th className="p-4 text-center">Imprimir</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyticalData.map((data, index) => {
                                    const resultado = data.receitaTotal - data.custoTotal;
                                    const isExpanded = expandedRows.includes(index);
                                    
                                    return (
                                        <React.Fragment key={data.veiculoId}>
                                            <tr className="bg-slate-800 border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer" onClick={() => toggleRow(index)}>
                                                <td className="p-4 text-center">
                                                    <button className="text-slate-400">
                                                        {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-white">{data.veiculo?.Placa}</div>
                                                    <div className="text-xs text-slate-400">{data.veiculo?.Motorista}</div>
                                                </td>
                                                <td className="p-4 text-center">{data.count}</td>
                                                <td className="p-4 text-right font-mono text-green-300">{formatCurrency(data.receitaTotal)}</td>
                                                <td className="p-4 text-right font-mono text-orange-300">{formatCurrency(data.custoTotal)}</td>
                                                <td className="p-4 text-right font-mono">{formatCurrency(data.totalPedagio)}</td>
                                                <td className="p-4 text-right font-mono">{formatCurrency(data.totalChapa)}</td>
                                                <td className="p-4 text-right font-mono">{formatCurrency(data.totalOutras)}</td>
                                                <td className={`p-4 text-right font-bold font-mono ${resultado >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {formatCurrency(resultado)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button 
                                                        onClick={(e) => handlePrintClick(e, data)}
                                                        className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-600" 
                                                        title="Imprimir Recibo / Termo de Aceite"
                                                    >
                                                        <PrinterIcon className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-slate-900/30">
                                                    <td colSpan={10} className="p-0">
                                                        <div className="p-4 m-4 bg-slate-800/50 rounded-md border border-slate-700">
                                                            <h4 className="text-md font-semibold text-sky-400 mb-3 flex items-center">
                                                                <TruckIcon className="w-5 h-5 mr-2"/> Detalhamento das Viagens - {data.veiculo?.Placa}
                                                            </h4>
                                                            <table className="w-full text-xs">
                                                                <thead className="text-slate-500 uppercase bg-slate-800/80">
                                                                    <tr>
                                                                        <th className="p-2 text-left">Data</th>
                                                                        <th className="p-2 text-left">Rota (Cidades)</th>
                                                                        <th className="p-2 text-right">Receita (CTE)</th>
                                                                        <th className="p-2 text-right">Custo (Frete)</th>
                                                                        <th className="p-2 text-right">Resultado</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-700/50">
                                                                    {data.lancamentos.map(lanc => {
                                                                        const rec = lanc.Cargas.reduce((s, c) => s + c.ValorCTE, 0);
                                                                        const cust = lanc.Calculo.ValorTotal;
                                                                        const res = rec - cust;
                                                                        const cidades = [...new Set(lanc.Cargas.map(c => c.Cidade))].join(', ');
                                                                        const cleanDate = String(lanc.DataFrete).split('T')[0];

                                                                        return (
                                                                            <tr key={lanc.ID_Lancamento}>
                                                                                <td className="p-2">{new Date(cleanDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                                                                <td className="p-2 text-slate-300">{cidades}</td>
                                                                                <td className="p-2 text-right text-green-300/80">{formatCurrency(rec)}</td>
                                                                                <td className="p-2 text-right text-orange-300/80">{formatCurrency(cust)}</td>
                                                                                <td className={`p-2 text-right font-bold ${res >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(res)}</td>
                                                                            </tr>
                                                                        );
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-slate-700 text-slate-200 font-bold">
                                <tr>
                                    <td colSpan={2} className="p-4 text-right">TOTAIS GERAIS:</td>
                                    <td className="p-4 text-center">{analyticalData.reduce((s, d) => s + d.count, 0)}</td>
                                    <td className="p-4 text-right text-green-400">{formatCurrency(analyticalData.reduce((s, d) => s + d.receitaTotal, 0))}</td>
                                    <td className="p-4 text-right text-orange-400">{formatCurrency(analyticalData.reduce((s, d) => s + d.custoTotal, 0))}</td>
                                    <td className="p-4 text-right">{formatCurrency(analyticalData.reduce((s, d) => s + d.totalPedagio, 0))}</td>
                                    <td className="p-4 text-right">{formatCurrency(analyticalData.reduce((s, d) => s + d.totalChapa, 0))}</td>
                                    <td className="p-4 text-right">{formatCurrency(analyticalData.reduce((s, d) => s + d.totalOutras, 0))}</td>
                                    <td className="p-4 text-right">
                                        {formatCurrency(analyticalData.reduce((s, d) => s + (d.receitaTotal - d.custoTotal), 0))}
                                    </td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                     </div>
                      {analyticalData.length === 0 && (
                        <div className="text-center p-8 text-slate-400">
                            Nenhum dado encontrado para gerar o relatório analítico.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
