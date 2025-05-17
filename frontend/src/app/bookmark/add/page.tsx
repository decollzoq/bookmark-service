'use client';

import { BookmarkForm } from '@/components/BookmarkForm';
import { useRouter } from 'next/navigation';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import Link from 'next/link';

export default function AddBookmarkPage() {
  const router = useRouter();
  const { currentUser } = useBookmarkStore();
  
  const handleSuccess = () => {
    router.push('/bookmark');
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">북마크 추가</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-3xl mx-auto">
        {currentUser ? (
          <BookmarkForm onSuccess={handleSuccess} />
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-amber-800 mb-4">
              북마크를 추가하려면 먼저 로그인이 필요합니다.
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