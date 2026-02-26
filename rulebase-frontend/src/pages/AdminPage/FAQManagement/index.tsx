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

  const { data: categories } = useQuery({
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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">FAQ 관리</h2>
        <Button size="sm" onClick={() => setShowCategoryModal(true)}>카테고리 추가</Button>
      </div>

      <div className="space-y-4">
        {categories?.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">카테고리가 없습니다</p>
        )}
        {categories?.map(cat => (
          <div key={cat.id} className="bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-700">{cat.name}</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => { setSelectedCategoryId(cat.id); setShowItemModal(true); }}
                >
                  항목 추가
                </Button>
                <button
                  onClick={() => {
                    if (window.confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?`))
                      deleteCategoryMutation.mutate(cat.id);
                  }}
                  className="text-sm text-red-500 hover:underline"
                >
                  삭제
                </button>
              </div>
            </div>
            {cat.items.length === 0 && <p className="text-sm text-gray-400 p-4">항목이 없습니다</p>}
            {cat.items.map(item => (
              <div key={item.id} className="p-4 border-b last:border-b-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">Q: {item.question}</p>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">A: {item.answer}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('이 항목을 삭제하시겠습니까?'))
                        deleteItemMutation.mutate(item.id);
                    }}
                    className="text-xs text-red-500 hover:underline whitespace-nowrap"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <Modal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="카테고리 추가"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCategoryModal(false)}>취소</Button>
            <Button onClick={() => createCategoryMutation.mutate()} loading={createCategoryMutation.isPending} disabled={!categoryName.trim()}>추가</Button>
          </>
        }
      >
        <Input label="카테고리 이름" value={categoryName} onChange={e => setCategoryName(e.target.value)} />
      </Modal>

      <Modal
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        title="FAQ 항목 추가"
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
