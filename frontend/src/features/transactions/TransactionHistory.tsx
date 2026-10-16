import { useState } from 'react';
import API from '../../api/axiosInstance';
import type { Transaction } from '../../types/types';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onTransactionDeleted: () => void;
}

export default function TransactionHistory({ transactions, onTransactionDeleted }: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleDelete = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту операцию? Баланс счета будет автоматически пересчитан.')) return;
    try {
      await API.delete(`/transactions/${id}`);
      onTransactionDeleted();
    } catch (error) {
      console.error(error);
      alert('Ошибка при удалении транзакции');
    }
  };

  const filteredRows = transactions.filter((tx) => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return true;

    const description = (tx.description || '').toLowerCase();
    const category = (tx.category_name || '').toLowerCase();
    const account = (tx.account_name || '').toLowerCase();
    const typeText = tx.type === 'transfer' ? 'перевод' : tx.type === 'income' ? 'доход' : 'расход';

    return description.includes(search) || 
           category.includes(search) || 
           account.includes(search) ||
           typeText.includes(search);
  });

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4 transition-colors duration-300">
      
      {/* КРАСИВЫЙ БЛОК ШАПКИ ИСТОРИИ И СТРОКА ПОИСКА С ТЕМНЫМ РЕЖИМОМ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">История операций</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">Найдено записей: {filteredRows.length}</p>
        </div>

        {/* СТРОКА ПОИСКА (ИНПУТ АДАПТИРОВАН ПОД ТЕМНУЮ ТЕМУ) */}
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="🔍 Поиск по названию, категории..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 p-2 pl-8 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {filteredRows.length === 0 ? (
        <div className="text-center text-slate-400 dark:text-slate-500 py-10 text-sm">
          {searchQuery ? 'Ничего не найдено по вашему запросу.' : 'Нет операций за выбранный период.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider font-bold">
                <th className="py-3">Дата</th>
                <th className="py-3">Кошелек</th>
                <th className="py-3">Категория</th>
                <th className="py-3">Сумма</th>
                <th className="py-3">Комментарий</th>
                <th className="py-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredRows.map((tx) => {
                const isIncome = tx.type === 'income';
                const isTransfer = tx.type === 'transfer';

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 text-xs text-slate-400 dark:text-slate-500">
                      {new Date(tx.transaction_date).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="py-3.5 font-medium text-slate-900 dark:text-slate-100">{tx.account_name}</td>
                    <td className="py-3.5">
                      {isTransfer ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/40">
                          ⇄ Перевод
                        </span>
                      ) : (
                        tx.category_name || 'Разное'
                      )}
                    </td>
                    <td className={`py-3.5 font-bold ${isIncome ? 'text-emerald-600 dark:text-emerald-500' : isTransfer ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-500'}`}>
                      {isIncome ? '+' : isTransfer ? '⇄ ' : '-'}
                      {new Intl.NumberFormat('ru-RU').format(tx.amount)}
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={tx.description}>
                      {tx.description || '—'}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(tx.id)}
                        className="rounded-lg p-1 text-slate-400 dark:text-slate-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 transition"
                        title="Удалить операцию"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
