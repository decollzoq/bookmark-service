'use client';

import React, { useEffect, useState } from 'react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, Category, Tag } from '@/types';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import categoryService from '@/api/categoryService';

interface SharedViewProps {
  params: {
    uuid: string;
  };
}

export default function SharedView({ params }: SharedViewProps) {
  const { 
    bookmarks, 
    categories, 
    importCategoryWithBookmarks,
    addBookmark,
    getCategoryBookmarks,
    getShareLinkByUuid,
    currentUser,
    updateCategory
  } = useBookmarkStore();
  
  const router = useRouter();
  // params를 React.use()로 unwrap (타입 캐스팅 적용)
  const unwrappedParams = React.use(params as unknown as Promise<{ uuid: string }>);
  const uuid = unwrappedParams.uuid;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharedBookmark, setSharedBookmark] = useState<Bookmark | null>(null);
  const [sharedCategory, setSharedCategory] = useState<Category | null>(null);
  const [categoryBookmarks, setCategoryBookmarks] = useState<Bookmark[]>([]);
  // 로컬 스토리지에서 sharedLinks 가져오기
  const getSharedLinksFromLocalStorage = () => {
    try {
      const storedData = localStorage.getItem('bookmark-storage');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData?.state?.sharedLinks) {
          return parsedData.state.sharedLinks;
        }
      }
    } catch (err) {
    }
    return [];
  };
  
  useEffect(() => {
  }, [currentUser]);
  
  // 공유 링크 조회 및 데이터 로드
  useEffect(() => {
    const loadSharedData = async () => {
      if (!uuid) {
        setError('공유 링크가 유효하지 않습니다.');
        setLoading(false);
        return;
      }
      try {
        // 스토어에서 공유 링크 조회
        const shareData = getShareLinkByUuid(uuid);
        // 스토어에서 찾지 못한 경우 로컬 스토리지에서 직접 조회
        if (!shareData || !shareData.link) {
          const sharedLinks = getSharedLinksFromLocalStorage();
          const directLink = sharedLinks.find((link: any) => link.uuid === uuid);
          
          if (!directLink) {
            setError('유효하지 않은 공유 링크입니다. 새로운 링크를 요청하세요.');
            setLoading(false);
            return;
          }
          // 북마크 공유 처리
          if (directLink.bookmarkId) {
            const bookmark = bookmarks.find(b => b.id === directLink.bookmarkId);
            
            if (!bookmark) {
              setError('해당 북마크를 찾을 수 없습니다. 북마크가 삭제되었을 수 있습니다.');
              setLoading(false);
              return;
            }
            
            setSharedBookmark(bookmark);
            setLoading(false);
            return;
          }
          
          // 카테고리 공유 처리
          if (directLink.categoryId) {
            const category = categories.find(c => c.id === directLink.categoryId);
            
            if (!category) {
              setError('해당 카테고리를 찾을 수 없습니다. 카테고리가 삭제되었을 수 있습니다.');
              setLoading(false);
              return;
            }
            
            setSharedCategory(category);
            
            try {
              // 백엔드 API를 직접 호출하여 카테고리에 할당된 북마크 가져오기
              const categoryBookmarksData = await categoryService.getBookmarksByCategory(category.id);
              
              // API 응답을 프론트엔드 Bookmark 형식으로 변환
              const formattedBookmarks: Bookmark[] = categoryBookmarksData.map(item => {
                // 태그 변환
                const tagList: Tag[] = (item.tags || []).map(tag => ({
                  id: tag.id || `tag-${Math.random()}`,
                  name: tag.name,
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
              
              setCategoryBookmarks(formattedBookmarks);
            } catch (error) {
              console.error('카테고리 북마크를 가져오는 중 오류 발생:', error);
              setCategoryBookmarks([]);
            }
            
            setLoading(false);
            return;
          }
          
          setError('공유 링크에 연결된 데이터를 찾을 수 없습니다.');
          setLoading(false);
          return;
        } else {
          // 북마크 공유 처리
          if (shareData.link.bookmarkId && shareData.bookmarkData) {
            setSharedBookmark(shareData.bookmarkData);
            setLoading(false);
            return;
          }
          
          // 카테고리 공유 처리
          if (shareData.link.categoryId && shareData.categoryData) {
            setSharedCategory(shareData.categoryData);
            
            try {
              // 백엔드 API를 직접 호출하여 카테고리에 할당된 북마크 가져오기
              const categoryBookmarksData = await categoryService.getBookmarksByCategory(shareData.categoryData.id);
              
              // API 응답을 프론트엔드 Bookmark 형식으로 변환
              const formattedBookmarks: Bookmark[] = categoryBookmarksData.map(item => {
                // 태그 변환
                const tagList: Tag[] = (item.tags || []).map(tag => ({
                  id: tag.id || `tag-${Math.random()}`,
                  name: tag.name,
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
              
              setCategoryBookmarks(formattedBookmarks);
            } catch (error) {
              console.error('카테고리 북마크를 가져오는 중 오류 발생:', error);
              setCategoryBookmarks([]);
            }
            
            setLoading(false);
            return;
          }
          setError('공유 링크에 연결된 데이터를 찾을 수 없습니다.');
          setLoading(false);
          return;
        }
      } catch (error) {
        setError('공유 링크 데이터를 로드하는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };
    
    loadSharedData();
  }, [uuid, bookmarks, categories, getShareLinkByUuid, currentUser]);
  
  // 북마크 저장 함수
  const handleSaveBookmark = (bookmark: Bookmark) => {
    if (!currentUser) {
      toast.error('북마크를 저장하려면 로그인이 필요합니다');
      return;
    }
    
    try {
      // 북마크 복사본 생성 (ID 재생성)
      const newBookmark: Bookmark = {
        ...bookmark,
        id: uuidv4(),
        userId: currentUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      addBookmark(newBookmark);
      toast.success('북마크가 저장되었습니다');
      router.push('/');
    } catch (err) {
      toast.error('북마크 저장 중 오류가 발생했습니다');
    }
  };
  
  // 카테고리 import 함수
  const handleImportCategory = async () => {
    if (!currentUser) {
      toast.error('카테고리를 가져오려면 로그인이 필요합니다');
      return;
    }
    
    if (!sharedCategory) {
      toast.error('카테고리 정보를 찾을 수 없습니다');
      return;
    }
    
    try {
      // 카테고리 ID가 유효한지 확인
      if (!sharedCategory.id) {
        toast.error('유효하지 않은 카테고리입니다');
        return;
      }
      
      // importCategoryWithBookmarks는 비동기 함수이므로 await 처리
      const newCategory = await importCategoryWithBookmarks(sharedCategory.id);
      
      // newCategory가 null이 아닐 때만 성공 처리
      if (newCategory !== null) {
        // 카테고리 생성 성공 메시지 표시
        toast.success('카테고리를 성공적으로 가져왔습니다');
        router.push('/');
      } else {
        toast.error('카테고리 가져오기에 실패했습니다');
      }
    } catch (err) {
      toast.error('카테고리 가져오기 중 오류가 발생했습니다');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded-lg text-center">
        <h2 className="text-xl font-semibold mb-2">오류 발생</h2>
        <p>{error}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }
  
  // 북마크 공유
  if (sharedBookmark) {
    return (
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-amber-800">
            이 북마크는 공유 링크를 통해 확인하는 읽기 전용 콘텐츠입니다.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{sharedBookmark.title}</h1>
          
          <a 
            href={sharedBookmark.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-amber-600 hover:underline block mb-4"
          >
            {sharedBookmark.url}
          </a>
          
          {sharedBookmark.description && (
            <p className="text-gray-600 mb-4">{sharedBookmark.description}</p>
          )}
          
          {sharedBookmark.tagList && sharedBookmark.tagList.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">태그:</h3>
              <div className="flex flex-wrap gap-2">
                {sharedBookmark.tagList.map(tag => (
                  <span 
                    key={tag.id} 
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t border-gray-200">
            {currentUser ? (
              <button
                onClick={() => handleSaveBookmark(sharedBookmark)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 w-full"
              >
                내 북마크에 추가하기
              </button>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-2">북마크를 내 컬렉션에 추가하려면 로그인이 필요합니다.</p>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 inline-block"
                >
                  로그인
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // 카테고리 공유
  if (sharedCategory) {
    return (
      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-amber-800">
            이 카테고리는 공유 링크를 통해 확인하는 읽기 전용 콘텐츠입니다.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            {sharedCategory.title}
            {!sharedCategory.isPublic && (
              <span className="ml-2 text-sm font-normal bg-gray-200 text-gray-700 px-2 py-1 rounded">비공개</span>
            )}
          </h1>
          
          {sharedCategory.tagList && sharedCategory.tagList.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">태그:</h3>
              <div className="flex flex-wrap gap-2">
                {sharedCategory.tagList.map(tag => (
                  <span 
                    key={tag.id} 
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* 카테고리에 포함된 북마크 목록 표시 */}
          {categoryBookmarks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">북마크 목록</h3>
              <div className="space-y-4">
                {categoryBookmarks.map(bookmark => (
                  <div 
                    key={bookmark.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition"
                  >
                    <a 
                      href={bookmark.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-block"
                    >
                      <h4 className="font-medium text-gray-900 hover:text-amber-600">
                        {bookmark.title}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">{bookmark.url}</p>
                    </a>
                    
                    {bookmark.description && (
                      <p className="text-sm text-gray-600 mt-2">{bookmark.description}</p>
                    )}
                    
                    {bookmark.tagList && bookmark.tagList.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {bookmark.tagList.map(tag => (
                          <span 
                            key={tag.id} 
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-4 border-t border-gray-200">
            {currentUser ? (
              <button
                onClick={handleImportCategory}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 w-full"
              >
                내 카테고리에 추가하기
              </button>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-2">카테고리를 내 컬렉션에 추가하려면 로그인이 필요합니다.</p>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 inline-block"
                >
                  로그인
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded-lg text-center">
      <h2 className="text-xl font-semibold mb-2">데이터를 찾을 수 없음</h2>
      <p>공유된 북마크나 카테고리를 찾을 수 없습니다.</p>
      <button
        onClick={() => router.push('/')}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
      >
        홈으로 돌아가기
      </button>
    </div>
  );
} 