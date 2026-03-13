import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../../components/layout/AppShell';
import { faqApi } from '../../api/faq';
import type { FaqCategory } from '../../types';

function AccordionItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl transition-all ${open ? 'bg-blue-50 shadow-sm' : 'hover:bg-gray-50'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-5 py-4 flex items-center gap-4 transition-colors"
      >
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          open ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
        }`}>
          {index + 1}
        </span>
        <span className={`flex-1 font-medium ${open ? 'text-blue-700' : 'text-gray-800'}`}>{question}</span>
        <span className={`text-xs flex-shrink-0 transition-transform ${open ? 'rotate-180 text-blue-500' : 'text-gray-300'}`}>
          ▼
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 ml-11">
          <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed bg-white rounded-lg p-4 border border-blue-100">
            {answer}
          </div>
        </div>
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

  const totalItems = categories?.reduce((sum, c) => sum + c.items.length, 0) ?? 0;

  return (
    <AppShell>
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
        {/* Sidebar */}
        <div className="w-60 min-w-60 bg-white border-r border-gray-100 flex flex-col overflow-y-auto">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="text-base">💡</span>
              <h2 className="font-semibold text-gray-900 text-sm">FAQ 카테고리</h2>
            </div>
            {!isLoading && (
              <p className="text-xs text-gray-400 mt-1 ml-6">{categories?.length ?? 0}개 카테고리 · {totalItems}개 항목</p>
            )}
          </div>
          <div className="p-3 space-y-1">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))
            ) : (
              categories?.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between ${
                    activeCategory?.id === cat.id
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                    activeCategory?.id === cat.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {cat.items.length}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
          {activeCategory ? (
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">{activeCategory.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{activeCategory.items.length}개의 질문</p>
              </div>
              {activeCategory.items.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center">
                  <span className="text-4xl block mb-3">📭</span>
                  <p className="text-gray-400 text-sm">항목이 없습니다</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 space-y-1">
                  {activeCategory.items.map((item, i) => (
                    <AccordionItem key={item.id} question={item.question} answer={item.answer} index={i} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            !isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <span className="text-5xl block mb-4">💡</span>
                  <p className="text-gray-400 text-sm">카테고리를 선택하세요</p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}
