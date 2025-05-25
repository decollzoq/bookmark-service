'use client';

import React, { useState } from 'react';
import { Category, Bookmark } from '@/types';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { useRouter } from 'next/navigation';

interface BookmarkListImportProps {
  category: Category;
  bookmarks: Bookmark[];
  onSuccess?: () => void;
}

export const BookmarkListImport: React.FC<BookmarkListImportProps> = ({
  category,
  bookmarks,
  onSuccess
}) => {
  const { importCategoryWithBookmarks } = useBookmarkStore();
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [imported, setImported] = useState(false);
  const router = useRouter();
  
  const handleImport = async () => {
    if (importStatus === 'loading' || !category) return;
    
    try {
      setImportStatus('loading');
      
      // 카테고리와 북마크 가져오기
      const newCategory = importCategoryWithBookmarks(category.id);
      
      if (newCategory) {
        setImportStatus('success');
        
        // 성공 메시지와 함께 알림
        const matchedCount = bookmarks.length;
        alert(`"${newCategory.title}" 카테고리와 ${matchedCount}개의 북마크가 내 컬렉션에 추가되었습니다.`);
        
        // 상태 업데이트
        setImported(true);
        
        // 성공 콜백 호출
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        } else {
          // 기본 동작: 카테고리 목록으로 이동
          setTimeout(() => {
            router.push('/category');
          }, 1500);
        }
      } else {
        setImportStatus('error');
        alert('카테고리를 가져오는 중 오류가 발생했습니다.');
      }
    } catch (err) {
      setImportStatus('error');
      alert('내 컬렉션에 추가하는 중 오류가 발생했습니다.');
    }
  };
  
  return (
    <div className="mt-6 flex justify-center">
      {!imported ? (
        <button
          onClick={handleImport}
          disabled={importStatus === 'loading'}
          className={`px-4 py-2 ${
            importStatus === 'loading' 
              ? 'bg-gray-400 cursor-wait' 
              : 'bg-amber-500 hover:bg-amber-600'
          } text-white rounded-lg flex items-center transition-colors`}
        >
          {importStatus === 'loading' && (
            <span className="mr-2 inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          )}
          내 컬렉션에 추가하기
          {bookmarks.length > 0 && ` (${bookmarks.length}개 북마크 포함)`}
        </button>
      ) : (
        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg">
          성공적으로 추가되었습니다. 카테고리 목록으로 이동합니다...
        </div>
      )}
    </div>
  );
}; 