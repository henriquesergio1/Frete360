import React, { useState, useContext, ChangeEvent } from 'react';
import { DataContext } from '../context/DataContext';
import * as api from '../services/apiService';
import { CloudUploadIcon, CheckCircleIcon, XCircleIcon, SpinnerIcon } from './icons';

type ImportType = 'veiculos' | 'cargas' | 'parametros-valores' | 'parametros-taxas';

interface ImportResult {
    success: boolean;
    message: string;
    count: number;
}

const ImportCard: React.FC<{
    title: string;
    description: string;
    headers: string;
    importType: ImportType;
}> = ({ title, description, headers, importType }) => {
    const { reloadData } = useContext(DataContext);
    const [fileName, setFileName] = useState<string | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setResult(null);
        setIsImporting(true);

        try {
            const apiResult = await api.importData(file, importType);
            setResult({ 
                success: true, 
                message: `${apiResult.message} ${apiResult.count} registros processados.`, 
                count: apiResult.count 
            });
            // Reload relevant data
            if (importType === 'veiculos') await reloadData('veiculos');
            else if (importType === 'cargas') await reloadData('cargas');
            else if (importType === 'parametros-valores') await reloadData('parametrosValores');
            else if (importType === 'parametros-taxas') await reloadData('parametrosTaxas');

        } catch (error: any) {
            setResult({ success: false, message: error.message || 'Falha no upload do arquivo.', count: 0 });
        } finally {
            setIsImporting(false);
            // Reset file input to allow re-uploading the same file
            e.target.value = '';
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
            <div className="flex items-center mb-4">
                <CloudUploadIcon className="w-8 h-8 text-sky-400 mr-4" />
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
                <label htmlFor={`file-upload-${importType}`} className={`relative cursor-pointer text-white font-bold py-2 px-4 rounded-md transition duration-200 w-full text-center inline-flex items-center justify-center ${isImporting ? 'bg-slate-500' : 'bg-sky-600 hover:bg-sky-500'}`}>
                    {isImporting ? (
                        <>
                            <SpinnerIcon className="w-5 h-5 mr-2" />
                            <span>Importando...</span>
                        </>
                    ) : (
                       <span>{fileName ? `Arquivo: ${fileName}` : 'Selecionar Arquivo CSV'}</span>
                    )}
                    <input id={`file-upload-${importType}`} name={`file-upload-${importType}`} type="file" className="sr-only" accept=".csv" onChange={handleFileChange} disabled={isImporting} />
                </label>
            </div>
            {result && (
                <div className={`mt-4 p-3 rounded-md text-sm flex items-center ${result.success ? 'bg-green-900/50 text-green-200 border border-green-700/50' : 'bg-red-900/50 text-red-200 border border-red-700/50'}`}>
                    {result.success ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <XCircleIcon className="w-5 h-5 mr-2" />}
                    {result.message}
                </div>
            )}
        </div>
    );
};

export const Importacao: React.FC = () => {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Importação de Dados via CSV</h2>
                <p className="text-slate-400">Carregue seus dados de operação para o servidor usando arquivos no formato CSV.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ImportCard
                    title="Importar Veículos"
                    description="Faça o upload da sua frota de veículos."
                    headers="COD_Veiculo,Placa,TipoVeiculo,Motorista,CapacidadeKG,Ativo"
                    importType="veiculos"
                />
                 <ImportCard
                    title="Importar Cargas"
                    description="Carregue as cargas disponíveis para os veículos."
                    headers="NumeroCarga,Cidade,ValorCTE,DataCTE,COD_VEICULO"
                    importType="cargas"
                />
                <ImportCard
                    title="Importar Parâmetros de Valores"
                    description="Defina os valores base por cidade e tipo de veículo."
                    headers="Cidade,TipoVeiculo,ValorBase,KM"
                    importType="parametros-valores"
                />
                 <ImportCard
                    title="Importar Parâmetros de Taxas"
                    description="Defina as taxas (pedágio, balsa, etc.) por cidade."
                    headers="Cidade,Pedagio,Balsa,Ambiental,Chapa,Outras"
                    importType="parametros-taxas"
                />
            </div>
        </div>
    );
};