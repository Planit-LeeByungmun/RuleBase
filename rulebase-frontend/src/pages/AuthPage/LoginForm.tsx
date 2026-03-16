import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

interface Props {
  onForgotPassword: () => void;
}

export function LoginForm({ onForgotPassword }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuth();
  const addToast = useUiStore(s => s.addToast);
  const navigate = useNavigate();

  const DEFAULT_DOMAIN = 'planitsquare.com';

  const resolveEmail = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed.includes('@')) return `${trimmed}@${DEFAULT_DOMAIN}`;
    if (trimmed.endsWith('@')) return `${trimmed}${DEFAULT_DOMAIN}`;
    return trimmed;
  };

  // Show hint suffix: after '@' is typed, show default domain in gray if user hasn't typed their own
  const getHintSuffix = () => {
    if (!email.includes('@')) return '';
    const afterAt = email.split('@')[1] || '';
    if (afterAt.length === 0) return DEFAULT_DOMAIN;
    if (DEFAULT_DOMAIN.startsWith(afterAt) && afterAt !== DEFAULT_DOMAIN) return DEFAULT_DOMAIN.slice(afterAt.length);
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const fullEmail = resolveEmail(email);
    setEmail(fullEmail);
    setLoading(true);
    try {
      const res = await authApi.login({ email: fullEmail, password });
      const { token, user } = res.data.data;
      setAuth(token, user);
      addToast('로그인 성공!', 'success');
      navigate('/documents');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <p className="text-lg font-semibold text-gray-900">환영합니다</p>
        <p className="text-sm text-gray-500">계정에 로그인하세요</p>
      </div>
      <div className="w-full">
        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
        <div className="relative">
          <input
            type="text"
            lang="en"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={() => { if (email.trim()) setEmail(resolveEmail(email)); }}
            onKeyDown={e => {
              if (e.key === 'Tab' && getHintSuffix()) {
                e.preventDefault();
                setEmail(resolveEmail(email));
              }
            }}
            placeholder="아이디 또는 이메일"
            required
          />
          {getHintSuffix() && (
            <span
              className="absolute top-0 left-0 px-3 py-2 text-sm pointer-events-none"
              aria-hidden="true"
            >
              <span className="invisible">{email}</span>
              <span className="text-gray-400">{getHintSuffix()}</span>
            </span>
          )}
        </div>
      </div>
      <Input
        label="비밀번호"
        type="password"
        lang="en"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      <Button type="submit" loading={loading} className="w-full">로그인</Button>
      <button
        type="button"
        onClick={onForgotPassword}
        className="w-full text-sm text-gray-400 hover:text-blue-600 transition-colors"
      >
        비밀번호를 잊으셨나요?
      </button>
    </form>
  );
}
