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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <span className="text-3xl">📋</span>
          </div>
          <h1 className="text-3xl font-bold text-white">RuleBase</h1>
          <p className="text-blue-200 text-sm mt-1">회사 규정 관리 시스템</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {tab !== 'reset' && (
            <div className="flex p-1.5 mx-6 mt-6 bg-gray-100 rounded-xl">
              {(['login', 'register'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    tab === t
                      ? 'bg-white text-gray-900 shadow-sm'
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

        {/* Footer */}
        <p className="text-center text-blue-300 text-xs mt-6">
          &copy; 2026 RuleBase. All rights reserved.
        </p>
      </div>
    </div>
  );
}
