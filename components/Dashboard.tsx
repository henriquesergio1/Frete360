import React from 'react';
import { ChartBarIcon, TruckIcon, ExclamationIcon } from './icons';

// Reusable components for the page
const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode; description: string }> = ({ title, value, icon, description }) => (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg flex items-start">
        <div className="bg-slate-700 p-3 rounded-md mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>
    </div>
);

const ReportCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-sky-400 mb-4">{title}</h3>
        {children}
    </div>
);

const SimpleBarChart: React.FC<{ data: { label: string; value: number }[]; unit?: string }> = ({ data, unit = '' }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    return (
        <div className="space-y-4">
            {data.map(item => (
                <div key={item.label} className="flex items-center text-sm">
                    <div className="w-1/3 text-slate-300 truncate pr-2">{item.label}</div>
                    <div className="w-2/3 flex items-center">
                        <div className="w-full bg-slate-700 rounded-full h-4 mr-2">
                            <div
                                className="bg-sky-500 h-4 rounded-full"
                                style={{ width: `${(item.value / maxValue) * 100}%` }}
                            ></div>
                        </div>
                        <span className="font-mono text-white">{item.value.toLocaleString('pt-BR')}{unit}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Mock data for reports
const topCidadesData = [
    { label: 'Belo Horizonte', value: 2200 },
    { label: 'Rio de Janeiro', value: 1800 },
    { label: 'Curitiba', value: 1750 },
    { label: 'Campinas', value: 500 },
    { label: 'Santos', value: 450 },
].sort((a, b) => b.value - a.value);

const relancamentosData = [
    { label: 'Correção de valor', value: 12 },
    { label: 'Alteração de rota', value: 8 },
    { label: 'Lançamento indevido', value: 5 },
    { label: 'Outro', value: 2 },
].sort((a, b) => b.value - a.value);

const motoristaData = [
    { label: 'Carlos Pereira', value: 18 },
    { label: 'João da Silva', value: 15 },
    { label: 'Maria Oliveira', value: 12 },
    { label: 'Pedro Martins', value: 9 },
].sort((a, b) => b.value - a.value);


export const Dashboard: React.FC = () => {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">Dashboard</h2>
                <p className="text-slate-400">Visualize métricas e performance da operação.</p>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                 <MetricCard 
                    title="Total de Fretes (Hoje)" 
                    value="42" 
                    icon={<TruckIcon className="w-6 h-6 text-sky-400"/>}
                    description="+5 em relação a ontem"
                />
                 <MetricCard 
                    title="Valor Total Lançado" 
                    value="R$ 87.450,00" 
                    icon={<ChartBarIcon className="w-6 h-6 text-green-400"/>}
                    description="Mês atual"
                />
                 <MetricCard 
                    title="Cargas com Duplicidade" 
                    value="7" 
                    icon={<ExclamationIcon className="w-6 h-6 text-yellow-400"/>}
                    description="Detectadas esta semana"
                />
                 <MetricCard 
                    title="Média por Frete" 
                    value="R$ 2.082,14" 
                    icon={<ChartBarIcon className="w-6 h-6 text-indigo-400"/>}
                    description="Média dos últimos 30 dias"
                />
            </div>
            
            {/* Filters */}
            <div className="bg-slate-800 p-4 rounded-lg flex items-center space-x-4">
                <span className="font-semibold text-slate-300">Filtros:</span>
                 <div>
                    <label htmlFor="date-range" className="sr-only">Período</label>
                    <select id="date-range" className="bg-slate-700 text-white border border-slate-600 rounded-md p-2 text-sm focus:ring-sky-500 focus:border-sky-500">
                        <option>Últimos 30 dias</option>
                        <option>Este mês</option>
                        <option>Mês passado</option>
                        <option>Este ano</option>
                    </select>
                </div>
                 <div>
                    <label htmlFor="motorista-filter" className="sr-only">Motorista</label>
                    <select id="motorista-filter" className="bg-slate-700 text-white border border-slate-600 rounded-md p-2 text-sm focus:ring-sky-500 focus:border-sky-500">
                        <option>Todos os Motoristas</option>
                        <option>João da Silva</option>
                        <option>Maria Oliveira</option>
                    </select>
                </div>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ReportCard title="Top Cidades (Valor Base)">
                    <SimpleBarChart data={topCidadesData} unit=" BRL" />
                </ReportCard>

                <ReportCard title="Relançamentos por Motivo">
                    <SimpleBarChart data={relancamentosData} unit=" ocorrências" />
                </ReportCard>
                
                <ReportCard title="Performance por Motorista (Nº de Fretes)">
                     <SimpleBarChart data={motoristaData} unit=" fretes" />
                </ReportCard>

                <ReportCard title="Taxas por Tipo (Total)">
                     <div className="text-slate-400 text-center p-8">
                        <p>Gráfico de taxas em desenvolvimento.</p>
                     </div>
                </ReportCard>
            </div>

        </div>
    );
};