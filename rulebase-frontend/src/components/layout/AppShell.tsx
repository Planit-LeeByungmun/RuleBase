import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/documents', label: '문서' },
    { to: '/faq', label: 'FAQ' },
    ...(isAdmin ? [{ to: '/admin', label: '관리자' }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-blue-700 text-white shadow">
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link to="/documents" className="font-bold text-lg">RuleBase</Link>
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm font-medium transition-colors ${
                  location.pathname.startsWith(l.to)
                    ? 'text-white'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-200">{user?.displayName}</span>
            {isAdmin && (
              <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded font-semibold">
                관리자
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-blue-200 hover:text-white transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </nav>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
