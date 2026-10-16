import { useState, useEffect, useCallback } from 'react';
import Auth from './features/auth/Auth';
import AccountsList from './features/accounts/AccountsList';
import TransactionForm from './features/transactions/TransactionForm';
import TransactionHistory from './features/transactions/TransactionHistory';
import FinancialCharts from './features/analytics/FinancialCharts';
import ExportReport from './features/transactions/ExportReport';
import CategoryForm from './features/categories/CategoryForm';
import BudgetLimits from './features/budgets/BudgetLimits';
import FinancialWidgets from './features/analytics/FinancialWidgets';
import API from './api/axiosInstance';
import type { User, Account, Transaction, Category, CurrencyRatesResponse, BudgetStatus } from './types/types'; 

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [currencyRates, setCurrencyRates] = useState<{ [key: string]: number } | null>(null);
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);

  // НОВЫЙ СТЕЙТ: Премиальная Тёмная Тема (сохраняем выбор пользователя в браузере)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [filterMode, setFilterMode] = useState<'month' | 'range'>('month');
  const [currentMonth, setCurrentMonth] = useState<number>(10);
  const [currentYear, setCurrentYear] = useState<number>(2026);
  
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-10-15');

  const monthsList = [
    { value: 1, label: 'Январь' }, { value: 2, label: 'Февраль' }, { value: 3, label: 'Март' },
    { value: 4, label: 'Апрель' }, { value: 5, label: 'Май' }, { value: 6, label: 'Июнь' },
    { value: 7, label: 'Июль' }, { value: 8, label: 'Август' }, { value: 9, label: 'Сентябрь' },
    { value: 10, label: 'Октябрь' }, { value: 11, label: 'Ноябрь' }, { value: 12, label: 'Декабрь' }
  ];
  
  const yearsList: number[] =[2025, 2026, 2027];

  // ЭФФЕКТ: Вешаем класс 'dark' на самый верхний тег HTML для переключения стилей Tailwind
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAccounts([]);
    setTransactions([]);
    setCategories([]);
    setBudgets([]);
    setCurrencyRates(null);
    setSelectedAccountId(null);
    setUser(null);
  };
  const fetchAllData = useCallback(async () => {
    if (!user) return;
    try {
      let url = `/transactions`;
      let budgetUrl = `/budgets/status?filterMode=${filterMode}`;

      if (filterMode === 'month') {
        const queryParams = `month=${currentMonth}&year=${currentYear}`;
        url += `?${queryParams}`;
        budgetUrl += `&${queryParams}`;
      } else {
        const queryParams = `startDate=${startDate}&endDate=${endDate}`;
        url += `?${queryParams}`;
        budgetUrl += `&${queryParams}`;
      }

      const [accountsRes, transactionsRes, categoriesRes, currencyRes, budgetsRes] = await Promise.all([
        API.get<Account[]>('/accounts'),
        API.get<Transaction[]>(url),
        API.get<Category[]>('/categories'),
        API.get<CurrencyRatesResponse>('/currency/rates'),
        API.get<BudgetStatus[]>(budgetUrl)
      ]);

      setAccounts(accountsRes.data);
      setTransactions(transactionsRes.data);
      setCategories(categoriesRes.data);
      if (currencyRes.data && currencyRes.data.rates) {
        setCurrencyRates(currencyRes.data.rates);
      }
      setBudgets(budgetsRes.data);
    } catch (error) {
      console.error('Ошибка синхронизации данных:', error);
    }
  }, [user, filterMode, currentMonth, currentYear, startDate, endDate]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }
      try {
        const response = await API.get<User>('/auth/me');
        setUser(response.data);
      } catch (error) {
        localStorage.removeItem('token');
      } finally { setLoading(false); }
    };
    checkAuth();
  }, []);

  useEffect(() => { if (user) fetchAllData(); }, [user, fetchAllData]);

  const calculateTotalCapitalInKGS = () => {
    if (!accounts || accounts.length === 0) return 0;
    return accounts.reduce((total, acc) => {
      const balance = parseFloat(acc.balance.toString());
      if (acc.currency === 'KGS') return total + balance;
      if (currencyRates && currencyRates[acc.currency]) {
        return total + (balance / currencyRates[acc.currency]);
      }
      return total;
    }, 0);
  };

  if (loading && !user) return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-semibold text-slate-400">Синхронизация...</div>;
  if (!user) return <Auth onLoginSuccess={(userData: User) => setUser(userData)} />;

  const filteredTransactions = selectedAccountId
    ? transactions.filter(tx => tx.account_id === selectedAccountId || (tx.type === 'transfer' && tx.target_account_id === selectedAccountId))
    : transactions;

  const activeAccount = accounts.find(a => a.id === selectedAccountId);
  const totalCapitalKGS = calculateTotalCapitalInKGS();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Шапка сайта */}
      <header className="flex items-center justify-between bg-slate-900 dark:bg-slate-900/90 px-6 py-4 text-white shadow-md border-b border-slate-800">
        <h1 className="text-lg font-black tracking-wider">💰 КАПИТАЛТРЕКЕР</h1>
        <div className="flex items-center gap-4 text-sm">
          
          {/* ИНТЕРАКТИВНЫЙ ПЕРЕКЛЮЧАТЕЛЬ ДЕНЬ / НОЧЬ */}
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold transition hover:bg-slate-700 flex items-center gap-1.5 border border-slate-700"
          >
            {darkMode ? '☀️ Светлая тема' : '🌙 Тёмная тема'}
          </button>

          <span className="hidden sm:inline">Привет, <b>{user.username}</b></span>
          <button onClick={handleLogout} className="rounded-xl bg-rose-600 px-3 py-1.5 font-bold text-white hover:bg-rose-700 transition">Выйти</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-6 space-y-6">
        
        {/* БЛОК 1: СУММАРНЫЙ КАПИТАЛ */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 p-6 text-white shadow-lg border border-slate-800/60 flex flex-col gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Суммарный очищенный капитал</p>
            <h2 className="text-3xl font-black tracking-tight text-emerald-400">
              {new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalCapitalKGS)}{' '}
              <span className="text-xl font-bold text-slate-400">KGS</span>
            </h2>
          </div>
          <div className="border-t border-slate-800/80 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <p className="font-medium text-slate-300">
              {currencyRates ? (
                <span className="flex flex-wrap gap-x-4 gap-y-1">
                  <span>Курсы Нацбанка:</span>
                  <span className="text-slate-200 font-bold">🇺🇸 1 USD = {(1 / currencyRates['USD']).toFixed(2)} KGS</span>
                  <span className="text-slate-200 font-bold">🇷🇺 1 RUB = {(1 / currencyRates['RUB']).toFixed(2)} KGS</span>
                  <span className="text-slate-200 font-bold">🇪🇺 1 EUR = {(1 / currencyRates['EUR']).toFixed(2)} KGS</span>
                </span>
              ) : (
                <span>Загрузка актуальных курсов НБКР...</span>
              )}
            </p>
            <p className="text-[10px] text-slate-500 italic">*Мультивалютный пересчет капитала выполнен автоматически</p>
          </div>
        </div>

        {/* БЫСТРЫЕ ФИНАНСОВЫЕ ВИДЖЕТЫ */}
        <FinancialWidgets 
          transactions={filteredTransactions} 
          filterMode={filterMode}
          currentMonth={currentMonth} 
          currentYear={currentYear} 
          startDate={startDate}
          endDate={endDate}
        />

        {/* БЛОК 2: ВСЕ СЧЕТА И КАРТЫ */}
        <AccountsList 
          accounts={accounts} 
          selectedAccountId={selectedAccountId} 
          onAccountSelect={(id) => setSelectedAccountId(id === selectedAccountId ? null : id)} 
          onAccountCreated={fetchAllData} 
        />

        {/* БЛОК 3: ПАНЕЛЬ ВЫПИСКИ И ФИЛЬТРОВ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">
              {activeAccount ? `Выписка по счету: ${activeAccount.name}` : 'Общая панель остатков'}
            </h2>
            <div className="flex gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={filterMode === 'month'} onChange={() => setFilterMode('month')} />По месяцам
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={filterMode === 'range'} onChange={() => setFilterMode('range')} />Указать период
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filterMode === 'month' ? (
              <>
                <select className="rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200" value={currentMonth} onChange={(e) => setCurrentMonth(parseInt(e.target.value))}>
                  {monthsList.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <select className="rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200" value={currentYear} onChange={(e) => setCurrentYear(parseInt(e.target.value))}>
                  {yearsList.map(y => <option key={y} value={y}>{y} г.</option>)}
                </select>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300">
                <input type="date" className="rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span>до</span>
                 <input 
                  type="date" 
                  className="rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200" 
                  value={endDate} 
                  min={startDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
            )}

            {selectedAccountId && activeAccount ? (
              <ExportReport 
                account={activeAccount}
                periodText={filterMode === 'month' ? `${monthsList.find(m => m.value === currentMonth)?.label} ${currentYear}` : `${startDate} - ${endDate}`}
                filterMode={filterMode}
                currentMonth={currentMonth}
                currentYear={currentYear}
                startDate={startDate}
                endDate={endDate}
              />
            ) : (
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl font-bold border border-amber-200 dark:border-amber-900/60">
                Выберите карту для выгрузки выписки
              </span>
            )}

            <CategoryForm onCategoryCreated={fetchAllData} />
            <TransactionForm accounts={accounts} categories={categories} onTransactionCreated={fetchAllData} />
          </div>
        </div>

        {/* БЛОК 4: БЮДЖЕТЫ */}
        <BudgetLimits budgets={budgets} currentMonth={currentMonth} currentYear={currentYear} onBudgetUpdated={fetchAllData} />

        {/* БЛОК 5: ГРАФИКИ */}
        <FinancialCharts transactions={filteredTransactions} />

        {/* БЛОК 6: ИСТОРИЯ */}
        <TransactionHistory transactions={filteredTransactions} onTransactionDeleted={fetchAllData} />

      </main>
    </div>
  );
}
