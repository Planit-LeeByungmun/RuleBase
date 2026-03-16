import React, { useState } from 'react';
import { authApi } from '../../../api/auth';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface Props {
  onBack: () => void;
}

export function RequestReset({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.requestPasswordReset(email);
    } catch {
      // Don't reveal if email exists
    } finally {
      setSent(true);
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <span className="text-3xl">📧</span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">이메일을 확인하세요</h3>
          <p className="text-sm text-gray-500 mt-2">
            입력하신 이메일로 재설정 링크를 발송했습니다.
          </p>
          <p className="text-xs text-gray-400 mt-1">링크는 1시간 동안 유효합니다</p>
        </div>
        <Button variant="secondary" onClick={onBack} className="w-full">로그인으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-gray-900">비밀번호 재설정</h3>
        <p className="text-sm text-gray-500">가입한 이메일 주소를 입력하시면 재설정 링크를 보내드립니다.</p>
      </div>
      <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <Button type="submit" loading={loading} className="w-full">재설정 링크 발송</Button>
      <button type="button" onClick={onBack} className="w-full text-sm text-gray-400 hover:text-blue-600 transition-colors">
        로그인으로 돌아가기
      </button>
    </form>
  );
}
