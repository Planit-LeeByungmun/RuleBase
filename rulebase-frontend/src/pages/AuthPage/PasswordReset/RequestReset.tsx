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
      <div className="text-center space-y-4">
        <div className="text-4xl">📧</div>
        <h3 className="font-semibold">이메일을 확인하세요</h3>
        <p className="text-sm text-gray-600">
          입력하신 이메일로 재설정 링크를 발송했습니다. (1시간 유효)
        </p>
        <Button variant="secondary" onClick={onBack} className="w-full">로그인으로 돌아가기</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-gray-800">비밀번호 재설정</h3>
      <p className="text-sm text-gray-600">가입한 이메일 주소를 입력하시면 재설정 링크를 보내드립니다.</p>
      <Input label="이메일" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <Button type="submit" loading={loading} className="w-full">재설정 링크 발송</Button>
      <button type="button" onClick={onBack} className="w-full text-sm text-gray-500 hover:text-gray-700">
        돌아가기
      </button>
    </form>
  );
}
