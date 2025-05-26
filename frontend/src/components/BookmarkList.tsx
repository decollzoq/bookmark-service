'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useBookmarkStore, useHydration } from '@/store/useBookmarkStore';
import { Bookmark, Category, Tag } from '@/types';
import categoryService from '@/api/categoryService';

interface BookmarkListProps {
  categoryId?: string;
}

export const BookmarkList: React.FC<BookmarkListProps> = ({ categoryId }) => {
  const { 
    getUserBookmarks, 
    getCategoryBookmarks, 
    deleteBookmark, 
    currentUser, 
    categories 
  } = useBookmarkStore();
  
  const isHydrated = useHydration();
  const [mounted, setMounted] = useState(false);
  const [sortOption, setSortOption] = useState<string>('updatedAt');
  const [filterText, setFilterText] = useState<string>('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 클라이언트 사이드에서만 마운트 설정
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // 북마크 데이터 로드
  useEffect(() => {
    const loadBookmarks = async () => {
      if (!mounted || !isHydrated) return;
      
      try {
        setIsLoading(true);
        
        if (categoryId) {
          // 백엔드 API를 통해 카테고리별 북마크 가져오기
          const response = await categoryService.getBookmarksByCategory(categoryId);
          
          // API 응답을 프론트엔드 Bookmark 형식으로 변환
          const formattedBookmarks: Bookmark[] = response.map(item => {
            // 태그 변환: 백엔드에서 tagNames 필드로 태그 정보가 전달됨
            const tagList: Tag[] = (item.tagNames || []).map(tag => ({
              id: tag.id || `tag-${tag.name || 'unknown'}-${Math.random()}`,
              name: tag.name || '무제 태그',
              userId: currentUser?.id || ''
            }));
            
            return {
              id: item.id,
              title: item.title,
              url: item.url,
              description: item.description || '',
              categoryId: item.categoryId || null,
              tagList: tagList,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              isFavorite: item.isFavorite || false,
              userId: currentUser?.id || '',
              integrated: false
            };
          });
          
          setBookmarks(formattedBookmarks);
        } else {
          // 전체 북마크는 스토어에서 가져오기
          const userBookmarks = getUserBookmarks();
          setBookmarks(userBookmarks);
        }
      } catch (error) {
        console.error('북마크를 가져오는 중 오류 발생:', error);
        setBookmarks([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBookmarks();
  }, [categoryId, currentUser, isHydrated, mounted]);
  
  // 하이드레이션이 완료되기 전 또는 마운트되기 전에는 간단한 로딩 UI 표시
  if (!isHydrated || !mounted) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }
  
  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
        <span className="ml-3">북마크를 불러오는 중...</span>
      </div>
    );
  }
  
  // 검색어로 추가 필터링
  const filteredBookmarks = bookmarks.filter(bookmark => 
    bookmark.title.toLowerCase().includes(filterText.toLowerCase()) ||
    bookmark.url.toLowerCase().includes(filterText.toLowerCase()) ||
    bookmark.description?.toLowerCase().includes(filterText.toLowerCase()) ||
    bookmark.tagList.some(tag => tag.name.toLowerCase().includes(filterText.toLowerCase()))
  );
  
  // 정렬
  const sortedBookmarks = [...filteredBookmarks].sort((a, b) => {
    if (sortOption === 'title') {
      return a.title.localeCompare(b.title);
    } else if (sortOption === 'createdAt') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });
  
  const handleDeleteBookmark = (bookmark: Bookmark) => {
    if (window.confirm(`"${bookmark.title}" 북마크를 삭제하시겠습니까?`)) {
      deleteBookmark(bookmark.id);
      // 목록에서도 삭제
      setBookmarks(prev => prev.filter(b => b.id !== bookmark.id));
    }
  };
  
  // 카테고리 이름 가져오기
  const getCategoryName = (categoryId: string | null): string => {
    if (!categoryId) return '카테고리 없음';
    const category = categories.find((c: Category) => c.id === categoryId);
    return category ? category.title : '카테고리 없음';
  };

  // 태그 매칭 여부 확인 (강조 표시용)
  const isTagMatched = (bookmark: Bookmark, catId: string): boolean => {
    // 직접 연결된 북마크는 제외
    if (bookmark.categoryId === catId) return false;
    
    // 카테고리 찾기
    const category = categories.find(c => c.id === catId);
    if (!category || !category.tagList || category.tagList.length === 0) return false;
    
    // 카테고리 태그 ID 집합 생성
    const categoryTagIds = new Set(category.tagList.map(tag => tag.id));
    
    // 북마크 태그 중 하나라도 카테고리 태그와 일치하는지 확인
    return bookmark.tagList.some(tag => categoryTagIds.has(tag.id));
  };
  
  return (
    <div className="space-y-4">
      {/* 로그인 안된 경우 로그인 권장 메시지 */}
      {!currentUser && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-center">
          <p className="text-amber-800">
            북마크를 관리하려면 <Link href="/login" className="font-bold underline">로그인</Link>이 필요합니다.
          </p>
        </div>
      )}
      
      {/* 필터링 및 정렬 컨트롤 */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="북마크 검색..."
            className="w-full px-4 py-2 border rounded-lg"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          {filterText && (
            <button 
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              onClick={() => setFilterText('')}
            >
              ×
            </button>
          )}
        </div>
        
        <div className="flex-shrink-0">
          <select
            className="px-4 py-2 border rounded-lg"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="updatedAt">최근 업데이트순</option>
            <option value="createdAt">최근 추가순</option>
            <option value="title">제목순</option>
          </select>
        </div>
      </div>
      
      {/* 북마크 목록 */}
      {sortedBookmarks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {filterText 
            ? '검색 결과가 없습니다.' 
            : currentUser 
              ? '등록된 북마크가 없습니다. 새 북마크를 추가해 보세요!' 
              : '로그인 후 이용할 수 있습니다.'
          }
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedBookmarks.map(bookmark => (
            <div 
              key={bookmark.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition group relative"
            >
              <div className="flex items-start">
                {bookmark.image && (
                  <div className="mr-4 flex-shrink-0">
                    <img 
                      src={bookmark.image} 
                      alt={bookmark.title} 
                      className="w-16 h-16 object-cover rounded-md"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="flex-grow">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-lg text-gray-900 group-hover:text-amber-600">
                      <a 
                        href={bookmark.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {bookmark.title}
                      </a>
                    </h3>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link
                        href={`/bookmark/edit/${bookmark.id}`}
                        className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                        title="수정"
                      >
                        ✎
                      </Link>
                      <button
                        onClick={() => handleDeleteBookmark(bookmark)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600"
                        title="삭제"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 truncate my-1">
                    <a 
                      href={bookmark.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {bookmark.url}
                    </a>
                  </p>
                  
                  {bookmark.description && (
                    <p className="text-sm text-gray-700 mt-1">{bookmark.description}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {bookmark.integrated && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                        통합
                      </span>
                    )}
                    {bookmark.tagList.map(tag => (
                      <span 
                        key={tag.id} 
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 