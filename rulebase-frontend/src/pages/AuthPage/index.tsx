import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { RequestReset } from './PasswordReset/RequestReset';

type Tab = 'login' | 'register' | 'reset';

export function AuthPage() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>('login');

  if (isAuthenticated) return <Navigate to="/documents" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-blue-700 text-center">RuleBase</h1>
          <p className="text-center text-gray-500 text-sm mt-1">회사 규정 관리 시스템</p>
        </div>

        {tab !== 'reset' && (
          <div className="flex border-b">
            {(['login', 'register'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'login' ? '로그인' : '회원가입'}
              </button>
            ))}
          </div>
        )}

        <div className="p-6">
          {tab === 'login' && <LoginForm onForgotPassword={() => setTab('reset')} />}
          {tab === 'register' && <RegisterForm onSuccess={() => setTab('login')} />}
          {tab === 'reset' && <RequestReset onBack={() => setTab('login')} />}
        </div>
      </div>
    </div>
  );
}
