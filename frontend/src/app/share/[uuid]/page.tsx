'use client';

import React, { useEffect, useState } from 'react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, Category, Tag } from '@/types';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import categoryService from '@/api/categoryService';
import { BookmarkResponse } from '@/api/bookmarkService';

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
    addCategory,
    findOrCreateTag,
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
  const [currentPath, setCurrentPath] = useState('');
  
  // 클라이언트 사이드에서 현재 경로 가져오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentPath(window.location.pathname);
    }
  }, []);
  
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
        // 스토어에서 공유 링크 조회 (백엔드 우선)
        const shareData = await getShareLinkByUuid(uuid);
        
        if (!shareData || !shareData.link) {
          setError('유효하지 않은 공유 링크입니다. 링크가 만료되었거나 삭제되었을 수 있습니다.');
            setLoading(false);
            return;
          }
          
          // 북마크 공유 처리
          if (shareData.link.bookmarkId && shareData.bookmarkData) {
            setSharedBookmark(shareData.bookmarkData);
            setLoading(false);
            return;
          }
          
          // 카테고리 공유 처리
          if (shareData.link.categoryId && shareData.categoryData) {
            setSharedCategory(shareData.categoryData);
            
          // 백엔드에서 받은 북마크 데이터가 있으면 직접 사용
          if (shareData.bookmarks && shareData.bookmarks.length > 0) {
            const formattedBookmarks: Bookmark[] = shareData.bookmarks.map((item: BookmarkResponse) => {
              // 태그 변환: 백엔드에서 tagNames 필드로 태그 정보가 전달됨
              const tagList: Tag[] = (item.tagNames || []).map((tag: any) => ({
                id: tag.id || `tag-${tag.name || 'unknown'}-${Math.random()}`,
                name: tag.name || '무제 태그',
                userId: 'shared'
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
                isFavorite: item.favorite || false,
                userId: 'shared',
                integrated: false
              };
            });
            
            setCategoryBookmarks(formattedBookmarks);
          } else {
            // 백엔드에서 북마크 데이터가 없으면 빈 배열 설정
            setCategoryBookmarks([]);
          }
          
          setLoading(false);
          return;
        }
        
        setError('공유 링크에 연결된 데이터를 찾을 수 없습니다.');
        setLoading(false);
      } catch (error) {
        console.error('공유 링크 데이터 로드 오류:', error);
        setError('공유 링크 데이터를 로드하는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };
    
    loadSharedData();
  }, [uuid, getShareLinkByUuid]);
  
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
      // 1. 카테고리 태그 처리
      let categoryTagList: Tag[] = [];
      if (sharedCategory.tagList && sharedCategory.tagList.length > 0) {
        const categoryTagPromises = sharedCategory.tagList.map(async (tag) => {
          try {
            return await findOrCreateTag(tag.name);
          } catch (error) {
            console.error('카테고리 태그 생성/조회 실패:', error);
            return null;
          }
        });
        
        const createdCategoryTags = await Promise.all(categoryTagPromises);
        categoryTagList = createdCategoryTags.filter(tag => tag !== null) as Tag[];
      }
      
      // 2. 새 카테고리 생성
      const newCategoryId = await addCategory({
        title: sharedCategory.title,
        tagList: categoryTagList,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: currentUser.id,
        isPublic: false // 가져온 카테고리는 기본적으로 비공개
      });
      
      if (!newCategoryId) {
        toast.error('카테고리 생성에 실패했습니다');
        return;
      }
      
      // 3. 카테고리에 포함된 북마크들도 복사
      if (categoryBookmarks && categoryBookmarks.length > 0) {
        const copyPromises = categoryBookmarks.map(async (bookmark) => {
          try {
            // 태그가 있는 경우 태그를 먼저 생성/조회
            let processedTagList: Tag[] = [];
            if (bookmark.tagList && bookmark.tagList.length > 0) {
              const tagPromises = bookmark.tagList.map(async (tag) => {
                try {
                  return await findOrCreateTag(tag.name);
                } catch (error) {
                  console.error('태그 생성/조회 실패:', error);
                  return null;
                }
              });
              
              const createdTags = await Promise.all(tagPromises);
              processedTagList = createdTags.filter(tag => tag !== null);
            }
            
            await addBookmark({
              title: bookmark.title,
              url: bookmark.url,
              description: bookmark.description,
              categoryId: newCategoryId,
              tagList: processedTagList,
              updatedAt: new Date().toISOString(),
              integrated: false
            });
          } catch (error) {
            console.error('북마크 복사 실패:', error);
          }
        });
        
        await Promise.all(copyPromises);
      }
      
      toast.success(`카테고리 "${sharedCategory.title}"를 성공적으로 가져왔습니다`);
        router.push('/');
    } catch (err) {
      console.error('카테고리 가져오기 오류:', err);
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
                  href={`/login?redirect=${encodeURIComponent(currentPath)}`}
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
                  href={`/login?redirect=${encodeURIComponent(currentPath)}`}
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