import React, { useState, useEffect } from 'react';
import API from '../../api/axiosInstance';
import type { Account, Category } from '../../types/types';

interface TransactionFormProps {
  accounts: Account[];
  categories: Category[];
  onTransactionCreated: () => void;
}

export default function TransactionForm({ accounts, categories, onTransactionCreated }: TransactionFormProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [accountId, setAccountId] = useState<string>('');
  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Фильтруем категории по типу (доход или расход)
  const filteredCategories = categories.filter(c => c.type === type);

  // 1. Безопасный выбор дефолтных счетов при открытии формы или изменении массива счетов
  useEffect(() => {
    if (accounts.length > 0) {
      if (!accountId) setAccountId(accounts[0].id.toString());
      
      // Для перевода: если есть второй счет, выбираем его, иначе первый
      if (!targetAccountId) {
        const defaultTarget = accounts[1] ? accounts[1].id : accounts[0].id;
        setTargetAccountId(defaultTarget.toString());
      }
    }
  }, [accounts, accountId, targetAccountId]);

  // 2. ЗАЩИТА: Безопасное переключение категорий при смене типа (доход/расход/перевод)
  useEffect(() => {
    if (type === 'transfer') {
      setCategoryId(''); // Для переводов категория не нужна
    } else if (filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0].id.toString()); // Ставим первую доступную
    } else {
      setCategoryId('');
    }
  }, [type, categories]); // Срабатывает строго при смене типа 'income' / 'expense' / 'transfer'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId || !amount || parseFloat(amount) <= 0) return;

    if (type === 'transfer') {
      if (accountId === targetAccountId) {
        alert('Счет списания и счет получения не могут совпадать!');
        return;
      }

      // Находим объекты выбранных счетов во фронтенд-стейтах
      const sourceAcc = accounts.find(a => a.id === parseInt(accountId));
      const targetAcc = accounts.find(a => a.id === parseInt(targetAccountId));

      // Проверяем соответствие валют перед отправкой запроса
      if (sourceAcc && targetAcc && sourceAcc.currency !== targetAcc.currency) {
        alert(`Ошибка валют! Нельзя переводить из ${sourceAcc.currency} в ${targetAcc.currency}. Валюты должны совпадать.`);
        return;
      }
    }

    setLoading(true);
    try {
      await API.post('/transactions', {
        account_id: parseInt(accountId),
        target_account_id: type === 'transfer' ? parseInt(targetAccountId) : null,
        category_id: type === 'transfer' ? null : (categoryId ? parseInt(categoryId) : null),
        amount: parseFloat(amount),
        type,
        description,
      });
      setAmount('');
      setDescription('');
      setIsOpen(false);
      onTransactionCreated();
    } catch (error) {
      console.error(error);
      alert('Ошибка при проведении операции');
    } finally {
      setLoading(false);
    }
  };

  if (accounts.length === 0) return null;

  return (
    <div>
      <button onClick={() => setIsOpen(true)} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
        + Добавить операцию
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Новая операция</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Переключатель типа операции */}
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                <button type="button" className={`rounded-md py-1.5 text-xs font-bold ${type === 'expense' ? 'bg-white text-rose-600 shadow' : 'text-slate-600'}`} onClick={() => setType('expense')}>Расход</button>
                <button type="button" className={`rounded-md py-1.5 text-xs font-bold ${type === 'income' ? 'bg-white text-emerald-600 shadow' : 'text-slate-600'}`} onClick={() => setType('income')}>Доход</button>
                <button type="button" className={`rounded-md py-1.5 text-xs font-bold ${type === 'transfer' ? 'bg-white text-blue-600 shadow' : 'text-slate-600'}`} onClick={() => setType('transfer')}>Перевод</button>
              </div>
              
              {/* Списание */}
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">
                  {type === 'transfer' ? 'Откуда списать' : 'Счет'}
                </label>
                <select className="w-full rounded-lg border border-slate-300 p-2 text-sm bg-white" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance} {acc.currency})</option>
                  ))}
                </select>
              </div>

              {/* Умное отображение полей в зависимости от типа */}
              {type === 'transfer' ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Куда зачислить</label>
                  <select className="w-full rounded-lg border border-slate-300 p-2 text-sm bg-white" value={targetAccountId} onChange={(e) => setTargetAccountId(e.target.value)}>
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({acc.balance} {acc.currency})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1">Категория</label>
                  <select className="w-full rounded-lg border border-slate-300 p-2 text-sm bg-white" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Сумма</label>
                <input type="number" step="0.01" min="0.01" required className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none" value={amount} onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => ['-', '+', 'e', 'E'].includes(e.key) && e.preventDefault()} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Комментарий</label>
                <input type="text" placeholder="Описание" className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-600">Отмена</button>
                <button type="submit" disabled={loading} className={`rounded-lg px-4 py-2 text-sm font-bold text-white ${type === 'expense' ? 'bg-rose-600' : type === 'income' ? 'bg-emerald-600' : 'bg-blue-600'}`}>{loading ? 'Проведение...' : 'Провести'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
