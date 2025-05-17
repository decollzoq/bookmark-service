'use client';

import React from 'react';
import Link from 'next/link';
import { useBookmarkStore, useHydration } from '@/store/useBookmarkStore';
import { Category, Bookmark } from '@/types';
import { BookmarkItem } from '@/components/BookmarkItem';
import { useRouter } from 'next/navigation';
import { BookmarkListImport } from '@/components/BookmarkListImport';

export default function ShareCategoryPage({ params }: { params: { categoryId: string } }) {
  // params를 React.use()로 unwrap (타입 캐스팅 적용)
  const unwrappedParams = React.use(params as unknown as Promise<{ categoryId: string }>);
  const categoryId = unwrappedParams.categoryId;
  
  // 하이드레이션 상태 확인
  const isHydrated = useHydration();
  const { categories, bookmarks } = useBookmarkStore();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [category, setCategory] = React.useState<Category | null>(null);
  const [categoryBookmarks, setCategoryBookmarks] = React.useState<Bookmark[]>([]);
  const router = useRouter();
  
  React.useEffect(() => {
    if (!isHydrated) {
      console.log("아직 데이터가 로드되지 않았습니다. 대기 중...");
      return; // 하이드레이션이 완료되지 않았으면 종료
    }
    
    setLoading(true);
    
    console.log("카테고리 ID로 직접 공유:", categoryId);
    console.log("하이드레이션 상태:", isHydrated);
    console.log("사용 가능한 카테고리 수:", categories.length);
    
    // 카테고리 ID로 카테고리 찾기
    const foundCategory = categories.find(c => c.id === categoryId);
    
    if (!foundCategory) {
      console.error("카테고리를 찾을 수 없음:", categoryId);
      if (categories.length === 0) {
        setError('로컬스토리지 데이터가 로드되지 않았거나 비어 있습니다. 카테고리를 먼저 생성해주세요.');
      } else {
        setError(`해당 카테고리(ID: ${categoryId})를 찾을 수 없습니다. 공유 링크가 올바른지 확인해주세요.`);
      }
      setLoading(false);
      return;
    }
    
    if (!foundCategory.isPublic) {
      console.error("비공개 카테고리:", foundCategory);
      setError('이 카테고리는 비공개 상태입니다.');
      setLoading(false);
      return;
    }
    
    setCategory(foundCategory);
    
    // 카테고리 태그와 일치하는 북마크 찾기
    if (foundCategory.tagList.length === 0) {
      console.warn("카테고리에 태그가 없음:", foundCategory);
      setCategoryBookmarks([]);
    } else {
      // 카테고리 태그와 북마크 태그 매칭
      const matchedBookmarks = bookmarks.filter(bookmark => {
        if (!bookmark.tagList || bookmark.tagList.length === 0) {
          return false;
        }
        
        // 태그 ID 기반 매칭
        return bookmark.tagList.some(bookmarkTag => 
          foundCategory.tagList.some(categoryTag => categoryTag.id === bookmarkTag.id)
        );
      });
      
      console.log("매칭된 북마크:", matchedBookmarks.length);
      setCategoryBookmarks(matchedBookmarks);
    }
    
    setLoading(false);
  }, [categoryId, categories, bookmarks, isHydrated]);
  
  // 카테고리 목록으로 이동하는 핸들러
  const handleNavigateToCategories = () => {
    router.push('/category');
  };
  
  if (!isHydrated || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        <p className="mt-4 text-gray-600">
          {!isHydrated ? "데이터 로딩 중..." : "공유 항목을 불러오는 중..."}
        </p>
        <p className="mt-2 text-sm text-gray-500">
          {!isHydrated ? "(※ 첫 방문 시 몇 초가 소요될 수 있습니다)" : ""}
        </p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg text-center">
        <h2 className="text-xl font-bold text-red-700 mb-4">오류 발생</h2>
        <p className="text-red-600 mb-4">{error}</p>
        <div className="text-sm text-gray-600 mb-4">
          (※ 다른 기기에서 생성된 공유 링크는 로컬스토리지 제한으로 인해 정상적으로 표시되지 않을 수 있습니다. 백엔드 서버 구현 후 개선될 예정입니다.)
        </div>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }
  
  if (!category) {
    return (
      <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">공유 항목을 찾을 수 없습니다</h2>
        <p className="text-gray-600 mb-4">존재하지 않는 카테고리입니다.</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">공유된 카테고리</h1>
        <Link 
          href="/" 
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          홈으로 돌아가기
        </Link>
      </div>
      
      <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
        <h2 className="text-lg font-semibold text-gray-700">{category.title}</h2>
        
        {category.tagList.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            <div className="text-sm text-gray-500 mr-2">포함된 태그:</div>
            {category.tagList.map((tag) => (
              <span 
                key={tag.id} 
                className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        
        <div className="mt-3 text-sm text-gray-500">
          북마크 {categoryBookmarks.length}개
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        {categoryBookmarks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            이 카테고리에는 북마크가 없습니다.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryBookmarks.map(bookmark => (
                <BookmarkItem key={bookmark.id} bookmark={bookmark} isReadOnly={true} />
              ))}
            </div>
          </>
        )}
        
        <div className="mt-4 text-center text-sm text-gray-500">
          이 카테고리는 공유 링크를 통해 확인하는 읽기 전용 콘텐츠입니다.
        </div>
      </div>
      
      {/* 내 컬렉션에 추가하기 버튼 */}
      <div className="flex justify-center space-x-3">
        <BookmarkListImport 
          category={category} 
          bookmarks={categoryBookmarks} 
          onSuccess={handleNavigateToCategories}
        />
        
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
} 