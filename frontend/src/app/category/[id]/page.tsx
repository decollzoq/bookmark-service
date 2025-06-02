'use client';

import { BookmarkList } from '@/components/BookmarkList';
import { ConfirmModal } from '@/components/ConfirmModal';
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
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
  
  // 카테고리 공유 실행 함수
  const executeShareCategory = async () => {
    try {
      const shareLink = await createShareLink({ categoryId: id });
      const fullShareUrl = `${window.location.origin}/share/${shareLink.uuid}`;
      
      // 클립보드에 복사
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullShareUrl);
        toast.success('공유 링크가 클립보드에 복사되었습니다! 🎉', {
          duration: 4000,
          position: 'bottom-center',
          style: {
            background: '#10B981',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px'
          },
          icon: '📋'
        });
      } else {
        // 클립보드 API를 지원하지 않는 브라우저 처리
        toast.success(`공유 링크: ${fullShareUrl}`, {
          duration: 6000,
          position: 'bottom-center',
          style: {
            background: '#10B981',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px'
          }
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`오류: ${error.message}`, {
          duration: 4000,
          position: 'bottom-center',
          style: {
            background: '#EF4444',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px'
          },
          icon: '❌'
        });
      } else {
        toast.error('공유 링크 생성에 실패했습니다.', {
          duration: 4000,
          position: 'bottom-center',
          style: {
            background: '#EF4444',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px'
          },
          icon: '❌'
        });
      }
    }
  };
  
  // 카테고리 공유 링크 생성
  const handleShareCategory = async () => {
    try {
      // 비공개 카테고리인 경우 확인 모달 표시
      if (!category.isPublic) {
        setShowConfirmModal(true);
        return;
      }
      
      // 공개 카테고리인 경우 바로 공유 실행
      await executeShareCategory();
    } catch (error) {
      console.error('카테고리 공유 오류:', error);
    }
  };

  // 모달 확인 버튼 클릭 시
  const handleConfirmShare = async () => {
    setShowConfirmModal(false);
    await executeShareCategory();
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setShowConfirmModal(false);
  };
  
  return (
    <div className="space-y-6">
      {/* 확인 모달 */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmShare}
        title="비공개 카테고리 공유"
        message="비공개 카테고리를 공유하려고 합니다. 공유 링크를 통해 다른 사용자가 이 카테고리를 볼 수 있게 됩니다. 계속하시겠습니까?"
        confirmText="공유하기"
        cancelText="취소"
        confirmButtonColor="bg-amber-600 hover:bg-amber-700"
      />

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