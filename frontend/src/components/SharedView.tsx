'use client';

import React, { useEffect, useState } from 'react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { Bookmark, Category } from '@/types';
import { BookmarkItem } from './BookmarkItem';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface SharedViewProps {
  uuid: string;
}

export const SharedView: React.FC<SharedViewProps> = ({ uuid }) => {
  const { sharedLinks, bookmarks, categories } = useBookmarkStore();
  const [data, setData] = useState<{
    type: 'bookmark' | 'category';
    title: string;
    items?: Bookmark[];
    bookmark?: Bookmark;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    setLoading(true);
    const directCategoryId = searchParams.get('categoryId');
    const directBookmarkId = searchParams.get('bookmarkId');
    
    const isDemoMode = searchParams.get('demo') === 'true';
    
    if (directCategoryId || directBookmarkId || isDemoMode) {
      if (directBookmarkId) {
        const bookmark = bookmarks.find(b => b.id === directBookmarkId);
        
        if (bookmark) {
          setData({
            type: 'bookmark',
            title: bookmark.title,
            bookmark
          });
          setLoading(false);
          return;
        }
      } else if (directCategoryId) {
        const category = categories.find(c => c.id === directCategoryId);
        
        if (category) {
          const categoryBookmarks = bookmarks.filter(bookmark => {
            if (!bookmark.tagList || bookmark.tagList.length === 0) {
              return false;
            }
            
            const categoryTagIds = new Set(category.tagList.map(tag => tag.id));
            
            return bookmark.tagList.some(tag => categoryTagIds.has(tag.id));
          });
          
          setData({
            type: 'category',
            title: category.title,
            items: categoryBookmarks,
          });
          setLoading(false);
          return;
        }
      } else if (isDemoMode) {
        if (categories.length > 0) {
          const demoCategory = categories[0];
          
          const demoBookmarks = bookmarks.filter(bookmark => {
            if (!bookmark.tagList || bookmark.tagList.length === 0) {
              return false;
            }
            
            const categoryTagIds = new Set(demoCategory.tagList.map(tag => tag.id));
            
            return bookmark.tagList.some(tag => categoryTagIds.has(tag.id));
          });
          
          if (demoBookmarks.length === 0 && bookmarks.length > 0) {
            setData({
              type: 'bookmark',
              title: bookmarks[0].title,
              bookmark: bookmarks[0]
            });
          } else {
            setData({
              type: 'category',
              title: demoCategory.title + ' (데모)',
              items: demoBookmarks.length > 0 ? demoBookmarks : bookmarks.slice(0, 3),
            });
          }
          setLoading(false);
          return;
        }
      }
    }
    
    const shareLink = sharedLinks.find(link => link.uuid === uuid);
    
    if (!shareLink) {
      setError('유효하지 않은 공유 링크입니다. 아래 방법을 시도해보세요:<br/><ol class="mt-2 text-left list-decimal pl-5"><li>동일한 브라우저에서 링크를 열기</li><li>카테고리 ID로 직접 접근: <code>/share/123?categoryId=실제ID</code></li><li>데모 모드 활성화: <code>/share/demo?demo=true</code></li></ol>');
      setLoading(false);
      return;
    }
    if (shareLink.bookmarkId) {
      const bookmark = bookmarks.find(b => b.id === shareLink.bookmarkId);
      
      if (!bookmark) {
        setError('해당 북마크를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
      setData({
        type: 'bookmark',
        title: bookmark.title,
        bookmark
      });
    } else if (shareLink.categoryId) {
      const category = categories.find(c => c.id === shareLink.categoryId);
      
      if (!category) {
        setError('해당 카테고리를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
      
      if (!category.isPublic) {
        setError('이 카테고리는 비공개 상태입니다.');
        setLoading(false);
        return;
      }
      if (category.tagList.length === 0) {
        console.warn("카테고리에 태그가 없음:", category);
        setData({
          type: 'category',
          title: category.title,
          items: [],
        });
      } else {
        const categoryBookmarks = bookmarks.filter(bookmark => {
          if (!bookmark.tagList || bookmark.tagList.length === 0) {
            return false;
          }
          
          const categoryTagIds = new Set(category.tagList.map(tag => tag.id));
          
          return bookmark.tagList.some(tag => categoryTagIds.has(tag.id));
        });
        setData({
          type: 'category',
          title: category.title,
          items: categoryBookmarks,
        });
      }
    } else {
      setError('올바르지 않은 공유 링크입니다.');
    }
    
    setLoading(false);
  }, [uuid, sharedLinks, bookmarks, categories, searchParams]);
  
  const handleImport = () => {
    try {
      if (!data) return;
      
      setImported(true);
      setTimeout(() => {
        if (data.type === 'bookmark') {
          router.push('/bookmark');
        } else {
          router.push('/category');
        }
      }, 1500);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('가져오기에 실패했습니다.');
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        <p className="mt-4 text-gray-600">공유 항목을 불러오는 중...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-lg text-center">
        <h2 className="text-xl font-bold text-red-700 mb-4">오류 발생</h2>
        <p className="text-red-600 mb-4" dangerouslySetInnerHTML={{ __html: error }}></p>
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="p-8 bg-gray-50 border border-gray-200 rounded-lg text-center">
        <h2 className="text-xl font-bold text-gray-700 mb-4">공유 항목을 찾을 수 없습니다</h2>
        <p className="text-gray-600 mb-4">링크가 만료되었거나 존재하지 않는 항목입니다.</p>
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
      <div className="p-4 bg-gray-100 border border-gray-200 rounded-lg">
        <h1 className="text-xl font-bold text-gray-800">
          {data.type === 'bookmark' ? '공유된 북마크' : '공유된 카테고리'}
        </h1>
        <h2 className="text-lg font-semibold text-gray-700 mt-2">{data.title}</h2>
      </div>
      
      {data.type === 'bookmark' && data.bookmark && (
        <div className="max-w-lg mx-auto">
          <BookmarkItem bookmark={data.bookmark} />
          <div className="mt-4 text-center text-sm text-gray-500">
            이 북마크는 공유 링크를 통해 확인하는 읽기 전용 콘텐츠입니다.
          </div>
        </div>
      )}
      
      {data.type === 'category' && data.items && (
        <>
          {data.items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              이 카테고리에는 북마크가 없습니다.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.items.map(bookmark => (
                  <BookmarkItem key={bookmark.id} bookmark={bookmark} />
                ))}
              </div>
              <div className="mt-4 text-center text-sm text-gray-500">
                이 카테고리는 공유 링크를 통해 확인하는 읽기 전용 콘텐츠입니다.
              </div>
            </>
          )}
        </>
      )}
      
      <div className="mt-6">
        {!imported ? (
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            내 컬렉션에 추가하기
          </button>
        ) : (
          <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            성공적으로 추가되었습니다. 리스트로 이동합니다...
          </div>
        )}
        
        <Link
          href="/"
          className="ml-3 inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}; 