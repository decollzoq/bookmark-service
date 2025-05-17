'use client';

import { CategoryForm } from '@/components/CategoryForm';
import { useRouter } from 'next/navigation';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import Link from 'next/link';

export default function AddCategoryPage() {
  const router = useRouter();
  const { currentUser } = useBookmarkStore();
  
  const handleSuccess = () => {
    router.push('/category');
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">카테고리 추가</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-3xl mx-auto">
        {currentUser ? (
          <CategoryForm onSuccess={handleSuccess} />
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-amber-800 mb-4">
              카테고리를 추가하려면 먼저 로그인이 필요합니다.
            </p>
            <Link 
              href="/login" 
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
            >
              로그인하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 