import React, { useState } from 'react';
import API from '../../api/axiosInstance';
import type { Account } from '../../types/types';

interface AccountsListProps {
  accounts: Account[];
  selectedAccountId: number | null; 
  onAccountSelect: (id: number) => void; 
  onAccountCreated: () => void;
}

export default function AccountsList({ accounts, selectedAccountId, onAccountSelect, onAccountCreated }: AccountsListProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [balance, setBalance] = useState<string>('');
  const [currency, setCurrency] = useState<string>('KGS'); 
  const [loading, setLoading] = useState<boolean>(false);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || (balance && parseFloat(balance) < 0)) return;

    setLoading(true);
    try {
      await API.post('/accounts', {
        name,
        balance: balance ? parseFloat(balance) : 0,
        currency,
      });
      setName('');
      setBalance('');
      setIsOpen(false);
      onAccountCreated();
    } catch (error) {
      console.error(error);
      alert('Ошибка при создании счета');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Мои счета и карты
        </h3>
        <button 
          onClick={() => setIsOpen(true)} 
          className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 transition"
        >
          + Добавить карту/счет
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-6 text-center text-slate-400 text-sm bg-white dark:bg-slate-900">
          У вас пока нет счетов.
        </div>
      ) : (
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {accounts.map((acc) => {
            const isSelected = acc.id === selectedAccountId;
            return (
              <div 
                key={acc.id} 
                onClick={() => onAccountSelect(acc.id)}
                className={`relative overflow-hidden rounded-xl border p-4 shadow-sm cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20 scale-[1.02]' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`absolute top-0 left-0 h-full w-1.5 ${isSelected ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`} />
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{acc.name}</p>
                  {isSelected && <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400 px-1.5 py-0.5 rounded">Активен</span>}
                </div>
                <p className="mt-2 text-xl font-black text-slate-800 dark:text-slate-100">
                  {new Intl.NumberFormat('ru-RU').format(acc.balance)}{' '}
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{acc.currency}</span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* МОВАЛЬНОЕ ОКНО СОЗДАНИЯ СЧЕТА С ТЕМНОЙ ТЕМОЙ */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Новый счет</h3>
            
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <input 
                type="text" required placeholder="Название (например: Демир Банк, Кошелек сомы)" 
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none" 
                value={name} onChange={(e) => setName(e.target.value)} 
              />
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number" step="0.01" min="0" placeholder="0.00" 
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
                  value={balance} onChange={(e) => setBalance(e.target.value)}
                  onKeyDown={(e) => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()}
                />
                <select 
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-sm bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none font-semibold" 
                  value={currency} onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="KGS">KGS (сом) 🇰🇬</option>
                  <option value="RUB">RUB (₽)</option>
                  <option value="USD">USD (\$)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" onClick={() => setIsOpen(false)} 
                  className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Отмена
                </button>
                <button 
                  type="submit" disabled={loading} 
                  className="bg-blue-600 px-4 py-2 rounded-xl text-sm font-bold text-white hover:bg-blue-700 transition"
                >
                  {loading ? 'Создание...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
