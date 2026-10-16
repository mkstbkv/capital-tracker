import React, { useState } from 'react';
import API from '../../api/axiosInstance';
// ВАЖНО: Импортируем типы именно как типы из файла types.ts
import type { AuthResponse, User } from '../../types/types';

interface AuthProps {
  onLoginSuccess: (user: User) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        const response = await API.post<AuthResponse>('/auth/login', { email, password });
        localStorage.setItem('token', response.data.token);
        onLoginSuccess(response.data.user);
      } else {
        await API.post('/auth/register', { username, email, password });
        alert('Регистрация успешна! Войдите в аккаунт.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка сети');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h2 className="text-center text-2xl font-bold text-slate-800 mb-6">
          {isLogin ? 'Вход в трекер' : 'Регистрация'}
        </h2>
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Имя"
              required
              className="w-full rounded border border-slate-300 p-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            required
            className="w-full rounded border border-slate-300 p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Пароль"
            required
            className="w-full rounded border border-slate-300 p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full rounded bg-blue-600 p-2 font-bold text-white hover:bg-blue-700">
            {isLogin ? 'Войти' : 'Создать аккаунт'}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="mt-4 w-full text-center text-sm text-blue-600">
          {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
        </button>
      </div>
    </div>
  );
}
