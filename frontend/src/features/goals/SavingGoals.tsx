import React, { useState } from 'react';
import API from '../../api/axiosInstance';
import type { Account, SavingGoal } from '../../types/types';

interface SavingGoalsProps {
  goals: SavingGoal[];
  accounts: Account[];
  onGoalsUpdated: () => void;
}

export default function SavingGoals({ goals, accounts, onGoalsUpdated }: SavingGoalsProps) {
  const [isCreateOpen, setIsOpen] = useState<boolean>(false);
  const [isFundOpen, setIsFundOpen] = useState<boolean>(false);
  
  // Стейты создания
  const [name, setName] = useState<string>('');
  const [targetAmount, setTargetAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('KGS');

  // Стейты пополнения
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [selectedAccId, setSelectedAccId] = useState<string>('');
  const [fundAmount, setFundAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || parseFloat(targetAmount) <= 0) return;
    setLoading(true);
    try {
      await API.post('/goals', { name: name.trim(), target_amount: parseFloat(targetAmount), currency });
      setName(''); setTargetAmount(''); setIsOpen(false);
      onGoalsUpdated();
    } catch (err) {
      alert('Ошибка при создании копилки');
    } finally { setLoading(false); }
  };

  const handleFundGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !selectedAccId || parseFloat(fundAmount) <= 0) return;
    setLoading(true);
    try {
      await API.post('/goals/fund', {
        goal_id: selectedGoalId,
        account_id: parseInt(selectedAccId),
        amount: parseFloat(fundAmount)
      });
      setFundAmount(''); setSelectedAccId(''); setIsFundOpen(false);
      onGoalsUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Ошибка пополнения');
    } finally { setLoading(false); }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-colors duration-300 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Финансовые цели и копилки</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Накапливайте средства на важные задачи</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition">
          + Создать цель
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center text-slate-400 dark:text-slate-500 py-6 text-xs font-semibold">У вас пока нет активных целей. Создайте первую!</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const target = parseFloat(g.target_amount.toString());
            const current = parseFloat(g.current_amount.toString());
            const percent = Math.min(Math.round((current / target) * 100), 100);

            return (
              <div key={g.id} className="rounded-xl border border-slate-100 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-200 truncate pr-2">{g.name}</h4>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/40">{percent}%</span>
                  </div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {new Intl.NumberFormat('ru-RU').format(current)} / <span className="text-slate-400">{new Intl.NumberFormat('ru-RU').format(target)} {g.currency}</span>
                  </p>
                </div>

                <div className="w-full bg-slate-200/60 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>

                <button 
                  onClick={() => { setSelectedGoalId(g.id); setIsFundOpen(true); }}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  📥 Пополнить копилку
                </button>
              </div>
            );
          })}
        </div>
      )}
      {/* МОВАЛЬНОЕ ОКНО: СОЗДАНИЕ ЦЕЛИ */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Новая финансовая цель</h3>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <input 
                type="text" required placeholder="Например: Новый Айфон, Машина, Иссык-Куль" 
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none font-medium"
                value={name} onChange={(e) => setName(e.target.value)} 
              />
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="number" required placeholder="Целевая сумма" min="1"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                  value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)}
                />
                <select 
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold outline-none"
                  value={currency} onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="KGS">KGS (сом) 🇰🇬</option>
                  <option value="USD">USD ($)</option>
                  <option value="RUB">RUB (₽)</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsOpen(false)} className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300">Отмена</button>
                <button type="submit" disabled={loading} className="bg-emerald-600 px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-emerald-700 transition">{loading ? 'Создание...' : 'Создать'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО: ПОПОЛНЕНИЕ КОПИЛКИ С КАРТЫ */}
      {isFundOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Пополнение копилки</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Укажите сумму и кошелек для списания средств</p>
            <form onSubmit={handleFundGoal} className="space-y-4">
              <select 
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold outline-none"
                value={selectedAccId} onChange={(e) => setSelectedAccId(e.target.value)} required
              >
                <option value="">Выберите карту/счет списания...</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name} (остаток: {new Intl.NumberFormat('ru-RU').format(a.balance)} {a.currency})</option>
                ))}
              </select>
              <input 
                type="number" required placeholder="Какую сумму отложить? (KGS)" min="1"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                value={fundAmount} onChange={(e) => setFundAmount(e.target.value)}
              />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsFundOpen(false)} className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300">Отмена</button>
                <button type="submit" disabled={loading} className="bg-blue-600 px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-blue-700 transition">{loading ? 'Перевод...' : 'Заморозить в копилку'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
