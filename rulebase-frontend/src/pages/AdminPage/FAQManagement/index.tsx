import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { faqApi } from '../../../api/faq';
import { useUiStore } from '../../../store/uiStore';
import type { FaqCategory } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';

export function FAQManagement() {
  const addToast = useUiStore(s => s.addToast);
  const queryClient = useQueryClient();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [itemForm, setItemForm] = useState({ question: '', answer: '' });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['faq', 'categories'],
    queryFn: async () => {
      const res = await faqApi.getCategories();
      return res.data.data as FaqCategory[];
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: () => faqApi.createCategory({ name: categoryName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq'] });
      setShowCategoryModal(false);
      setCategoryName('');
      addToast('카테고리가 추가되었습니다.', 'success');
    },
    onError: () => addToast('카테고리 추가에 실패했습니다.', 'error'),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => faqApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq'] });
      addToast('카테고리가 삭제되었습니다.', 'success');
    },
    onError: () => addToast('삭제에 실패했습니다.', 'error'),
  });

  const createItemMutation = useMutation({
    mutationFn: () => faqApi.createItem({
      categoryId: selectedCategoryId!,
      question: itemForm.question,
      answer: itemForm.answer,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq'] });
      setShowItemModal(false);
      setItemForm({ question: '', answer: '' });
      addToast('FAQ 항목이 추가되었습니다.', 'success');
    },
    onError: () => addToast('항목 추가에 실패했습니다.', 'error'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => faqApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faq'] });
      addToast('항목이 삭제되었습니다.', 'success');
    },
    onError: () => addToast('삭제에 실패했습니다.', 'error'),
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">💡</span>
          <h2 className="text-sm font-semibold text-gray-900">FAQ 관리</h2>
          {!isLoading && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
              {categories?.length ?? 0}개 카테고리
            </span>
          )}
        </div>
        <Button size="sm" onClick={() => setShowCategoryModal(true)}>카테고리 추가</Button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : categories?.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">📭</span>
            <p className="text-gray-400 text-sm">카테고리가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories?.map(cat => (
              <div key={cat.id} className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📂</span>
                    <h3 className="text-sm font-semibold text-gray-800">{cat.name}</h3>
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-white text-gray-400 border border-gray-200">
                      {cat.items.length}개
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedCategoryId(cat.id); setShowItemModal(true); }}
                      className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      항목 추가
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?`))
                          deleteCategoryMutation.mutate(cat.id);
                      }}
                      className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
                {cat.items.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-400 text-sm">항목이 없습니다</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {cat.items.map((item, i) => (
                      <div key={item.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {i + 1}
                              </span>
                              <p className="text-sm font-medium text-gray-900">{item.question}</p>
                            </div>
                            <p className="text-sm text-gray-500 whitespace-pre-wrap ml-7 leading-relaxed">{item.answer}</p>
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm('이 항목을 삭제하시겠습니까?'))
                                deleteItemMutation.mutate(item.id);
                            }}
                            className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors flex-shrink-0"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)} title="카테고리 추가"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>취소</Button>
            <Button onClick={() => createCategoryMutation.mutate()} loading={createCategoryMutation.isPending} disabled={!categoryName.trim()}>추가</Button>
          </>
        }
      >
        <Input label="카테고리 이름" value={categoryName} onChange={e => setCategoryName(e.target.value)} />
      </Modal>

      <Modal isOpen={showItemModal} onClose={() => setShowItemModal(false)} title="FAQ 항목 추가"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowItemModal(false)}>취소</Button>
            <Button onClick={() => createItemMutation.mutate()} loading={createItemMutation.isPending} disabled={!itemForm.question.trim() || !itemForm.answer.trim()}>추가</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="질문" value={itemForm.question} onChange={e => setItemForm(f => ({ ...f, question: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">답변</label>
            <textarea
              rows={5}
              value={itemForm.answer}
              onChange={e => setItemForm(f => ({ ...f, answer: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
