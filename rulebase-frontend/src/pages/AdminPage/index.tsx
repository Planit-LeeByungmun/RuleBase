import React, { useState } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { UserManagement } from './UserManagement';
import { FolderManagement } from './FolderManagement';
import { FAQManagement } from './FAQManagement';

type AdminTab = 'users' | 'folders' | 'faq';

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('users');

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'users', label: '사용자 승인' },
    { id: 'folders', label: '폴더 관리' },
    { id: 'faq', label: 'FAQ 관리' },
  ];

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto w-full px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">관리자 설정</h1>
        <div className="flex gap-1 mb-6 border-b">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
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
