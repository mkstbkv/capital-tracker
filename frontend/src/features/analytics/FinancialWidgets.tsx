import type { Transaction } from '../../types/types';

interface FinancialWidgetsProps {
  transactions: Transaction[];
  filterMode: 'month' | 'range'; 
  currentMonth: number;
  currentYear: number;
  startDate: string;             
  endDate: string;               
}

export default function FinancialWidgets({ transactions, filterMode, currentMonth, currentYear, startDate, endDate }: FinancialWidgetsProps) {
  
  // 1. Вычисляем доходы и расходы за выбранный период
  const totals = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') acc.income += Math.abs(tx.amount);
      else if (tx.type === 'expense') acc.expense += Math.abs(tx.amount);
      return acc;
    },
    { income: 0, expense: 0 }
  );

  // 2. РАСЧЕТ ВИДЖЕТА 1: Коэффициент сбережений
  const savings = totals.income - totals.expense;
  const savingsRate = totals.income > 0 ? Math.round((savings / totals.income) * 100) : 0;

  // 3. УМНЫЙ РАСЧЕТ ДНЕЙ В ЗАВИСИМОСТИ ОТ РЕЖИМА
  let daysCount = 0;
  if (filterMode === 'month') {
    daysCount = new Date(currentYear, currentMonth, 0).getDate();
  } else {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
  }

  // РАСЧЕТ ВИДЖЕТА 2: Средний расход в день
  const averagePerDay = daysCount > 0 ? totals.expense / daysCount : 0;

  // 4. РАСЧЕТ ВИДЖЕТА 3: Главная статья расходов
  const expenseByCategory = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc: { [key: string]: number }, tx) => {
      const catName = tx.category_name || 'Разное';
      acc[catName] = (acc[catName] || 0) + Math.abs(tx.amount);
      return acc;
    }, {});

  let topCategoryName = 'Нет трат';
  let topCategoryValue = 0;

  Object.keys(expenseByCategory).forEach((cat) => {
    if (expenseByCategory[cat] > topCategoryValue) {
      topCategoryValue = expenseByCategory[cat];
      topCategoryName = cat;
    }
  });
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Карточка 1: Коэффициент сбережений */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between transition-colors duration-300">
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Коэффициент сбережений</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {savingsRate > 0 ? `${savingsRate}%` : '0%'}
          </p>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
          {savingsRate >= 30 ? '🟢 Норма инвестирования в порядке' : '🟡 Рекомендуется откладывать от 20%'}
        </p>
      </div>

      {/* Карточка 2: Средний расход в день */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between transition-colors duration-300">
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">В среднем тратите в день</p>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(averagePerDay)} <span className="text-xs font-bold text-slate-400 dark:text-slate-500">KGS</span>
          </p>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
          Расчет исходит из {daysCount} дней выбранного периода
        </p>
      </div>

      {/* Карточка 3: Главный фокус трат */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-col justify-between transition-colors duration-300">
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Главная статья трат</p>
          <p className="text-lg font-black text-rose-600 dark:text-rose-500 mt-1.5 truncate" title={topCategoryName}>
            {topCategoryName}
          </p>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
          {topCategoryValue > 0 ? `Ушло: ${new Intl.NumberFormat('ru-RU').format(topCategoryValue)} KGS` : 'Расходов не зафиксировано'}
        </p>
      </div>
    </div>
  );
}
