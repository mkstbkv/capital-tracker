export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Account {
  id: number;
  user_id: number;
  name: string;
  balance: number;
  currency: string;
  created_at: string;
}

export interface Category {
  id: number;
  user_id: number | null;
  name: string;
  type: 'income' | 'expense';
  icon: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  account_id: number;
  target_account_id: number | null; // Теперь TypeScript знает про это поле!
  category_id: number | null;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  description: string;
  transaction_date: string;
  account_name?: string;
  category_name?: string;
}

export interface CurrencyRatesResponse {
  success: boolean;
  base: string;
  rates: { [key: string]: number };
  updated_at: string;
}

export interface BudgetStatus {
  category_id: number;
  category_name: string;
  limit_amount: number;
  current_expense: number;
}