import React, { useState } from 'react';
import { authApi } from '../../api/auth';
import { useUiStore } from '../../store/uiStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

interface Props {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const addToast = useUiStore(s => s.addToast);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.email) errs.email = '이메일을 입력하세요';
    if (!form.username || form.username.length < 3) errs.username = '사용자명은 3자 이상이어야 합니다';
    if (!form.displayName) errs.displayName = '이름을 입력하세요';
    if (!PASSWORD_REGEX.test(form.password)) {
      errs.password = '8자리 이상, 영문+숫자+특수문자(@$!%*#?&) 포함';
    }
    if (form.password !== form.confirmPassword) errs.confirmPassword = '비밀번호가 일치하지 않습니다';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setLoading(true);
    try {
      await authApi.register({
        email: form.email,
        username: form.username,
        displayName: form.displayName,
        password: form.password,
        department: form.department || undefined,
      });
      addToast('회원가입 신청이 완료되었습니다. 관리자 승인을 기다려 주세요.', 'success');
      onSuccess();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrors({ general: axiosErr.response?.data?.message || '회원가입에 실패했습니다.' });
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
  };

  const passwordValid = form.password ? PASSWORD_REGEX.test(form.password) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1 mb-1">
        <p className="text-lg font-semibold text-gray-900">회원가입</p>
        <p className="text-sm text-gray-500">계정을 생성하세요</p>
      </div>
      <Input label="이메일 *" type="email" lang="en" value={form.email} onChange={e => update('email', e.target.value)} error={errors.email} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="사용자명 *" value={form.username} onChange={e => update('username', e.target.value)} error={errors.username} placeholder="영문, 숫자, _" />
        <Input label="이름 *" value={form.displayName} onChange={e => update('displayName', e.target.value)} error={errors.displayName} />
      </div>
      <Input label="부서" value={form.department} onChange={e => update('department', e.target.value)} placeholder="선택사항" />
      <div>
        <Input label="비밀번호 *" type="password" lang="en" value={form.password} onChange={e => update('password', e.target.value)} error={errors.password} />
        {form.password && (
          <div className={`flex items-center gap-1.5 text-xs mt-1.5 ${passwordValid ? 'text-green-600' : 'text-amber-500'}`}>
            <span>{passwordValid ? '✅' : '⚠️'}</span>
            <span>{passwordValid ? '안전한 비밀번호입니다' : '8자리 이상, 영문+숫자+특수문자(@$!%*#?&) 포함'}</span>
          </div>
        )}
      </div>
      <Input label="비밀번호 확인 *" type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} error={errors.confirmPassword} />
      {errors.general && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <span>⚠️</span>
          <span>{errors.general}</span>
        </div>
      )}
      <Button type="submit" loading={loading} className="w-full mt-2">회원가입 신청</Button>
    </form>
  );
}
