'use client';

import { BookmarkList } from '@/components/BookmarkList';
import { useBookmarkStore, useHydration } from '@/store/useBookmarkStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import React from 'react';
import { Bookmark, Category } from '@/types';
import { notFound } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface CategoryPageProps {
  params: {
    id: string;
  };
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { categories, getUserCategories, createShareLink, updateCategory, currentUser } = useBookmarkStore();
  const router = useRouter();
  const isHydrated = useHydration();
  const [mounted, setMounted] = useState(false);
  
  // 클라이언트 사이드에서만 마운트 설정
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // params에서 id 직접 가져오기
  const id = params.id;
  
  // 하이드레이션이 완료되기 전 또는 마운트되기 전에는 간단한 로딩 UI 표시
  if (!isHydrated || !mounted) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">카테고리</h1>
            <p className="text-sm text-gray-500">로딩 중...</p>
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
  
  // 로그인 확인
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">로그인이 필요합니다</h1>
          <p className="mb-4">카테고리 내용을 확인하려면 로그인해주세요.</p>
          <Link
            href="/login"
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 inline-block"
          >
            로그인
          </Link>
        </div>
      </div>
    );
  }
  
  // 현재 사용자의 카테고리만 가져오기
  const userCategories = getUserCategories();
  const category = userCategories.find(c => c.id === id);
  
  if (!category) {
    return notFound();
  }
  
  // 콘솔에 카테고리 정보와 태그 출력 (디버깅용)
  // 카테고리 공유 링크 생성
  const handleShareCategory = () => {
    try {
      // 비공개 카테고리도 공유 가능함을 알림
      if (!category.isPublic) {
        const confirmShare = window.confirm('비공개 카테고리를 공유하려고 합니다. 공유 링크를 통해 다른 사용자가 이 카테고리를 볼 수 있게 됩니다. 계속하시겠습니까?');
        if (!confirmShare) {
          return;
        }
      }
      
      const shareLink = createShareLink({ categoryId: id });
      const fullShareUrl = `${window.location.origin}/share/${shareLink.uuid}`;
      
      // 클립보드에 복사
      if (navigator.clipboard) {
        navigator.clipboard.writeText(fullShareUrl)
          .then(() => {
            toast.success('공유 링크가 클립보드에 복사되었습니다.', {
              duration: 3000,
              position: 'bottom-center',
            });
          })
          .catch(error => {
            toast.error('클립보드 복사에 실패했습니다.', { 
              duration: 3000,
              position: 'bottom-center',
            });
            alert(`공유 링크: ${fullShareUrl}`);
          });
      } else {
        // 클립보드 API를 지원하지 않는 브라우저 처리
        alert(`공유 링크: ${fullShareUrl}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`오류: ${error.message}`, {
          duration: 3000,
          position: 'bottom-center',
        });
      } else {
        toast.error('링크 생성 중 오류가 발생했습니다.', {
          duration: 3000,
          position: 'bottom-center',
        });
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{category.title}</h1>
          <p className="text-sm text-gray-500">카테고리의 북마크 목록</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleShareCategory}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            title="카테고리 공유"
          >
            🔗 공유하기
          </button>
          <Link
            href={`/category/edit/${id}`}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            수정
          </Link>
          <Link
            href="/bookmark/add"
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            + 북마크 추가
          </Link>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <BookmarkList categoryId={id} />
      </div>
    </div>
  );
} 