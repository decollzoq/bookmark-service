'use client';

import React, { useEffect, useState } from 'react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { CategoryForm } from '@/components/CategoryForm';
import { useRouter } from 'next/navigation';
import { Category } from '@/types';

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  // params를 React.use()로 unwrap (타입 캐스팅 적용)
  const unwrappedParams = React.use(params as unknown as Promise<{ id: string }>);
  const id = unwrappedParams.id;
  
  const { categories } = useBookmarkStore();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      const found = categories.find(c => c.id === id);
      if (found) {
        setCategory(found);
      }
    }
    setLoading(false);
  }, [categories, id]);
  
  const handleSuccess = () => {
    router.push('/category');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
      </div>
    );
  }
  
  if (!category) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-2">카테고리를 찾을 수 없음</h2>
        <p>요청하신 카테고리를 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push('/category')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          카테고리 목록으로 돌아가기
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">카테고리 편집</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-3xl mx-auto">
        <CategoryForm category={category} onSuccess={handleSuccess} />
      </div>
    </div>
  );
} 