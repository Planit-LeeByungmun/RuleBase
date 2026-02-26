import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../components/layout/AppShell';
import { faqApi } from '../../api/faq';
import type { FaqCategory } from '../../types';

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-4 flex items-center justify-between gap-4 hover:text-blue-600 transition-colors"
      >
        <span className="font-medium text-gray-800">{question}</span>
        <span className="text-gray-400 text-xs flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="pb-4 text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{answer}</div>
      )}
    </div>
  );
}

export function FAQPage() {
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['faq', 'categories'],
    queryFn: async () => {
      const res = await faqApi.getCategories();
      return res.data.data as FaqCategory[];
    },
  });

  const activeCategory = activeCategoryId
    ? categories?.find(c => c.id === activeCategoryId)
    : categories?.[0];

  return (
    <AppShell>
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
        <div className="w-56 min-w-56 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-700 text-sm">FAQ 카테고리</h2>
          </div>
          <div className="p-2">
            {isLoading && <p className="text-sm text-gray-400 p-2">로딩 중...</p>}
            {categories?.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  activeCategory?.id === cat.id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {cat.name}
                <span className="ml-1 text-xs text-gray-400">({cat.items.length})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {activeCategory ? (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6">{activeCategory.name}</h2>
              {activeCategory.items.length === 0 && (
                <p className="text-gray-400 text-sm">항목이 없습니다.</p>
              )}
              <div className="bg-white rounded-xl border border-gray-200 px-6">
                {activeCategory.items.map(item => (
                  <AccordionItem key={item.id} question={item.question} answer={item.answer} />
                ))}
              </div>
            </>
          ) : (
            !isLoading && (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="text-5xl mb-3">❓</div>
                  <p>카테고리를 선택하세요</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}
