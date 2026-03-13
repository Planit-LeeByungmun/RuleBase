import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../../api/auth';
import { useUiStore } from '../../../store/uiStore';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,10}$/;

export function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const addToast = useUiStore(s => s.addToast);
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!PASSWORD_REGEX.test(form.newPassword)) {
      setError('8~10자리, 영문+숫자+특수문자(@$!%*#?&) 포함');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ token: token!, ...form });
      addToast('비밀번호가 재설정되었습니다.', 'success');
      navigate('/auth');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || '재설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold text-white">새 비밀번호 설정</h1>
          <p className="text-blue-200 text-sm mt-1">안전한 비밀번호를 입력하세요</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="새 비밀번호" type="password" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} />
            <Input label="비밀번호 확인" type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full">비밀번호 변경</Button>
          </form>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          &copy; 2026 RuleBase. All rights reserved.
        </p>
      </div>
    </div>
  );
}
