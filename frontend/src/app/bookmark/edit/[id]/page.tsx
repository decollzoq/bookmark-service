'use client';

import { BookmarkForm } from '@/components/BookmarkForm';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import React from 'react';
import { Bookmark } from '@/types';

export default function EditBookmarkPage({ params }: { params: { id: string } }) {
  // params를 React.use()로 unwrap (타입 캐스팅 적용)
  const unwrappedParams = React.use(params as unknown as Promise<{ id: string }>);
  const id = unwrappedParams.id;
  
  const { bookmarks } = useBookmarkStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [loading, setLoading] = useState(true);
  
  // redirect 파라미터 가져오기
  const redirectTo = searchParams.get('redirect') || '/bookmark';
  
  useEffect(() => {
    if (id) {
      const found = bookmarks.find(b => b.id === id);
      if (found) {
        setBookmark(found);
      }
    }
    setLoading(false);
  }, [bookmarks, id]);
  
  const handleSuccess = () => {
    router.push(redirectTo);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
      </div>
    );
  }
  
  if (!bookmark) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-2">북마크를 찾을 수 없음</h2>
        <p>요청하신 북마크를 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push('/bookmark')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          북마크 목록으로 돌아가기
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">북마크 편집</h1>
      
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-3xl mx-auto">
        <BookmarkForm bookmark={bookmark} onSuccess={handleSuccess} />
      </div>
    </div>
  );
} 