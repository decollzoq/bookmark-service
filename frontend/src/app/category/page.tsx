'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBookmarkStore, useHydration } from '@/store/useBookmarkStore';
import { Category } from '@/types';
import { useRouter } from 'next/navigation';

export default function CategoriesPage() {
  const { 
    deleteCategory, 
    updateCategory,
    getUserCategories,
    currentUser
  } = useBookmarkStore();
  
  const router = useRouter();
  const isHydrated = useHydration();
  const [mounted, setMounted] = useState(false);
  
  // 클라이언트 사이드에서만 마운트 설정
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 사용자의 카테고리 가져오기
  const userCategories = getUserCategories();

  // 하이드레이션이 완료되기 전 또는 마운트되기 전에는 간단한 로딩 UI 표시
  if (!isHydrated || !mounted) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">카테고리</h1>
            <p className="text-sm text-gray-500">북마크를 효율적으로 관리하는 카테고리 목록</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">카테고리</h1>
          <p className="text-sm text-gray-500">북마크를 효율적으로 관리하는 카테고리 목록</p>
        </div>
        
        <Link
          href="/category/add"
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          + 카테고리 추가
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCategories.map((category) => (
              <div 
                key={category.id} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition group"
              >
                <div className="flex justify-between items-start">
                  <Link href={`/category/${category.id}`}>
                    <h3 className="font-medium text-lg text-gray-900 group-hover:text-amber-600">
                      {category.title}
                    </h3>
                  </Link>
                  
                  <div className="flex space-x-1">
                    <Link
                      href={`/category/edit/${category.id}`}
                      className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                      title="수정"
                    >
                      ✎
                    </Link>
                    
                    <button
                      onClick={() => {
                        if (window.confirm('이 카테고리를 삭제하시겠습니까? 포함된 북마크는 삭제되지 않습니다.')) {
                          deleteCategory(category.id);
                        }
                      }}
                      className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600"
                      title="삭제"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                {category.tagList && category.tagList.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {category.tagList.map(tag => (
                      <span 
                        key={tag.id || `tag-${Math.random()}`} 
                        className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 