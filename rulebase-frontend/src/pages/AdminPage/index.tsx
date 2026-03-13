import React, { useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { UserManagement } from './UserManagement';
import { FolderManagement } from './FolderManagement';
import { FAQManagement } from './FAQManagement';

type AdminTab = 'users' | 'folders' | 'faq';

const tabs: { id: AdminTab; label: string; icon: string }[] = [
  { id: 'users', label: '사용자 승인', icon: '👤' },
  { id: 'folders', label: '폴더 관리', icon: '📁' },
  { id: 'faq', label: 'FAQ 관리', icon: '💡' },
];

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('users');

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto w-full px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">관리자 설정</h1>
          <p className="text-sm text-gray-500 mt-1">시스템 관리 및 설정</p>
        </div>

        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === t.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-sm">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'users' && <UserManagement />}
        {tab === 'folders' && <FolderManagement />}
        {tab === 'faq' && <FAQManagement />}
      </div>
    </AppShell>
  );
}
