import React, { useState } from 'react';
import API from '../../api/axiosInstance';
import type { BudgetStatus } from '../../types/types';

interface BudgetLimitsProps {
  budgets: BudgetStatus[];
  currentMonth: number;
  currentYear: number;
  onBudgetUpdated: () => void;
}

export default function BudgetLimits({ budgets, currentMonth, currentYear, onBudgetUpdated }: BudgetLimitsProps) {
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId || !amount || parseFloat(amount) <= 0) return;

    setLoading(true);
    try {
      await API.post('/budgets', {
        category_id: parseInt(selectedCatId),
        amount: parseFloat(amount),
        month: currentMonth,
        year: currentYear,
      });
      setAmount('');
      onBudgetUpdated(); 
    } catch (error) {
      console.error(error);
      alert('Ошибка при установке лимита');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors duration-300">
      {/* Левая колонка: Установка лимита */}
      <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-6 md:pb-0 md:pr-6 flex flex-col justify-center">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1">Лимиты расходов</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Установите максимальную сумму трат</p>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <select 
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold outline-none"
            value={selectedCatId} 
            onChange={(e) => setSelectedCatId(e.target.value)}
            required
          >
            <option value="">Выберите категорию...</option>
            {budgets.map(b => (
              <option key={b.category_id} value={b.category_id}>{b.category_name}</option>
            ))}
          </select>

          <input 
            type="number" step="1" min="1" placeholder="Сумма лимита (KGS)" required
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()}
          />

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full rounded-xl bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 py-2 text-xs font-black text-white transition-colors duration-200"
          >
            {loading ? 'Сохранение...' : 'Задать бюджет'}
          </button>
        </form>
      </div>
      {/* Правая колонка: Прогресс-бары лимитов */}
      <div className="md:col-span-2 space-y-4 max-h-64 overflow-y-auto pr-2">
        <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Состояние бюджетов</h4>
        
        {budgets.map((b) => {
          const limit = parseFloat(b.limit_amount.toString());
          const expense = parseFloat(b.current_expense.toString());
          
          if (limit === 0 && expense === 0) return null; 

          const percent = limit > 0 ? Math.min((expense / limit) * 100, 100) : 0;
          const isOverBudget = limit > 0 && expense > limit;

          let barColor = 'bg-emerald-500';
          if (percent >= 70 && percent <= 100) barColor = 'bg-amber-500';
          if (isOverBudget || limit === 0) barColor = 'bg-rose-500';

          return (
            <div key={b.category_id} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">{b.category_name}</span>
                <span className={isOverBudget ? 'text-rose-500 font-black' : 'text-slate-500 dark:text-slate-400'}>
                  {new Intl.NumberFormat('ru-RU').format(expense)} / {limit > 0 ? `${new Intl.NumberFormat('ru-RU').format(limit)} KGS` : 'Лимит не задан'}
                </span>
              </div>
              
              {/* Полоса прогресса подстроена под темный режим */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200/60 dark:border-slate-700/60">
                <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${limit > 0 ? percent : 100}%` }} />
              </div>
              {isOverBudget && (
                <p className="text-[10px] text-rose-500 font-black animate-pulse">⚠️ Превышение лимита на {new Intl.NumberFormat('ru-RU').format(expense - limit)} KGS!</p>
              )}
            </div>
          );
        })}

        {budgets.every(b => parseFloat(b.limit_amount.toString()) === 0 && parseFloat(b.current_expense.toString()) === 0) && (
          <div className="text-center text-slate-400 dark:text-slate-500 py-10 text-sm">
            В выбранном периоде нет трат и лимитов. Задайте лимит слева!
          </div>
        )}
      </div>
    </div>
  );
}
