import React, { useState } from 'react';
import API from '../../api/axiosInstance';

interface CategoryFormProps {
  onCategoryCreated: () => void;
}

export default function CategoryForm({ onCategoryCreated }: CategoryFormProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await API.post('/categories', {
        name: name.trim(),
        type,
      });
      setName('');
      setIsOpen(false);
      onCategoryCreated(); // Обновляем списки категорий в приложении
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Ошибка при создании категории';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => setIsOpen(true)} 
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 flex items-center gap-1.5"
        title="Создать свою личную категорию расходов или доходов"
      >
        🏷️ + Категория
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-black text-slate-800 mb-4">Новая категория</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Переключатель типа категории */}
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                <button 
                  type="button" 
                  className={`rounded-md py-1.5 text-xs font-bold ${type === 'expense' ? 'bg-white text-rose-600 shadow' : 'text-slate-600'}`} 
                  onClick={() => setType('expense')}
                >
                  Расходная
                </button>
                <button 
                  type="button" 
                  className={`rounded-md py-1.5 text-xs font-bold ${type === 'income' ? 'bg-white text-emerald-600 shadow' : 'text-slate-600'}`} 
                  onClick={() => setType('income')}
                >
                  Доходная
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1">Название категории</label>
                <input 
                  type="text" 
                  placeholder="Например: Хобби, Обучение, Бизнес" 
                  required 
                  maxLength={30}
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm bg-slate-50 outline-none focus:border-slate-400"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)} 
                  className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 transition"
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition"
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
