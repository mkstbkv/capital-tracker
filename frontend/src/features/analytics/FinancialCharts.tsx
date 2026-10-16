import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { Transaction } from '../../types/types';

interface FinancialChartsProps {
  transactions: Transaction[];
}

interface TrendItem {
  month: string;
  Доходы: number;
  Расходы: number;
}

interface TrendMap {
  [key: string]: TrendItem;
}

export default function FinancialCharts({ transactions }: FinancialChartsProps) {
  const [chartType, setChartType] = useState<'expense' | 'income'>('expense');
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#64748b', '#06b6d4'];

  const totals = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') acc.income += Math.abs(tx.amount);
      else if (tx.type === 'expense') acc.expense += Math.abs(tx.amount);
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const dataByCategory = transactions
    .filter(tx => tx.type === chartType)
    .reduce((acc: { [key: string]: number }, tx) => {
      const catName = tx.category_name || 'Разное';
      acc[catName] = (acc[catName] || 0) + Math.abs(tx.amount);
      return acc;
    }, {});

  const pieChartData = Object.keys(dataByCategory).map(name => ({
    name,
    value: dataByCategory[name]
  }));

  const trendDataMap = transactions.reduce((acc: TrendMap, tx) => {
    const date = new Date(tx.transaction_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });

    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthName, Доходы: 0, Расходы: 0 };
    }

    if (tx.type === 'income') acc[monthKey].Доходы += Math.abs(tx.amount);
    else if (tx.type === 'expense') acc[monthKey].Расходы += Math.abs(tx.amount);

    return acc;
  }, {});

  const trendChartData = Object.keys(trendDataMap)
    .sort()
    .map((key: string) => trendDataMap[key]);

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm text-center text-slate-400 dark:text-slate-500 text-sm transition-colors duration-300">
        Нет операций по выбранному периоду для построения интерактивной аналитики.
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* СЕТКА: Сводка оборотов + Круговой пончик */}
      <div className="grid gap-6 md:grid-cols-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors duration-300">
        
        {/* Левый блок: Цифры */}
        <div className="md:col-span-1 flex flex-col justify-center space-y-4 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-6 md:pb-0 md:pr-6">
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Обороты за период</h4>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Суммарные доходы</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-500">
              +{new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(totals.income)} <span className="text-sm font-bold">KGS</span>
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Чистые расходы</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-500">
              -{new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(totals.expense)} <span className="text-sm font-bold">KGS</span>
            </p>
          </div>
        </div>

        {/* Правый блок: Круговой график с табами */}
        <div className="md:col-span-2 h-72 w-full flex flex-col items-center justify-center relative">
          <div className="flex gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mb-2 text-xs font-bold shadow-inner">
            <button
              type="button"
              className={`rounded-lg px-4 py-1.5 transition-all duration-200 ${
                chartType === 'expense' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
              onClick={() => setChartType('expense')}
            >
              📉 Структура расходов
            </button>
            <button
              type="button"
              className={`rounded-lg px-4 py-1.5 transition-all duration-200 ${
                chartType === 'income' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400'
              }`}
              onClick={() => setChartType('income')}
            >
              📈 Структура доходов
            </button>
          </div>

          {pieChartData.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-12">Нет данных по выбранному типу операций.</p>
          ) : (
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {pieChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: any) => [new Intl.NumberFormat('ru-RU').format(Number(value) || 0), 'Сумма']} 
                />
                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ХРОНОЛОГИЧЕСКИЙ ТРЕНД CASHFLOW ПО МЕСЯЦАМ */}
      {trendChartData.length > 1 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 transition-colors duration-300">
          <div className="flex flex-col">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">Хронологический тренд CashFlow</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500">Сравнение динамики притока и оттока капитала по месяцам за весь период</p>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                {/* Подстроили сетку и оси под темную тему */}
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
                <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: '11px', fontWeight: '600' }} />
                <YAxis 
                  stroke="#94a3b8" 
                  style={{ fontSize: '11px' }} 
                  tickFormatter={(v) => new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(Number(v))} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: 'none', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: any) => [new Intl.NumberFormat('ru-RU').format(Number(value)), '']} 
                />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="Доходы" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInc)" />
                <Area type="monotone" dataKey="Расходы" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
