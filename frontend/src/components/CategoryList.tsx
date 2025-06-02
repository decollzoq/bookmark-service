'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { Category } from '@/types';
import { ConfirmModal } from './ConfirmModal';
import { toast } from 'react-hot-toast';

export const CategoryList: React.FC = () => {
  const { getUserCategories, deleteCategory, currentUser } = useBookmarkStore();
  
  // 삭제 확인 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  
  // 현재 사용자의 카테고리만 가져오기
  const userCategories = getUserCategories();
  
  const handleDeleteCategory = (category: Category) => {
    setShowDeleteModal(true);
    setCategoryToDelete(category);
  };

  const confirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id);
      
      // 삭제 성공 토스트 메시지
      toast.success(`"${categoryToDelete.title}" 카테고리가 삭제되었습니다.`, {
        duration: 3000,
        position: 'bottom-center',
        style: {
          background: '#10B981',
          color: 'white',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 16px'
        },
        icon: '🗑️'
      });
      
      setShowDeleteModal(false);
      setCategoryToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };
  
  return (
    <>
      <div className="space-y-4">
        {/* 로그인 안된 경우 로그인 권장 메시지 */}
        {!currentUser && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-amber-800">
              카테고리를 관리하려면 <Link href="/login" className="font-bold underline">로그인</Link>이 필요합니다.
            </p>
          </div>
        )}
        
        {userCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {currentUser 
              ? '등록된 카테고리가 없습니다. 새 카테고리를 추가해 보세요!'
              : '로그인 후 이용할 수 있습니다.'
            }
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCategories.map(category => (
              <div 
                key={category.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition group relative"
              >
                <div className="flex justify-between items-start">
                  <Link href={`/category/${category.id}`} className="hover:underline">
                    <h3 className="font-medium text-lg text-gray-900 group-hover:text-amber-600">
                      {category.title}
                    </h3>
                  </Link>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link
                      href={`/category/edit/${category.id}`}
                      className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                      title="수정"
                    >
                      ✎
                    </Link>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600"
                      title="삭제"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && categoryToDelete && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="카테고리 삭제"
          message={`"${categoryToDelete.title}" 카테고리를 삭제하시겠습니까?\n포함된 북마크는 카테고리가 없어집니다.`}
          confirmText="삭제하기"
          cancelText="취소"
          confirmButtonColor="bg-red-600 hover:bg-red-700"
        />
      )}
    </>
  );
}; 