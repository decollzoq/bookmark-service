'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { Bookmark, Tag } from '@/types';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/components/ConfirmModal';
import { toast } from 'react-hot-toast';

export default function BookmarksPage() {
  const { 
    toggleFavorite, 
    deleteBookmark, 
    updateBookmark, 
    deleteTag,
    getUserBookmarks,
    getUserTags,
    currentUser,
    categories
  } = useBookmarkStore();
  
  const router = useRouter();
  
  // 클라이언트 렌더링을 위한 상태 추가
  const [isClient, setIsClient] = useState(false);
  const [userBookmarksList, setUserBookmarksList] = useState<Bookmark[]>([]);
  const [userTagsList, setUserTagsList] = useState<Tag[]>([]);
  
  // 클라이언트 사이드에서만 실행되는 코드
  useEffect(() => {
    setIsClient(true);
    
    // 사용자 북마크와 태그 가져오기
    const bookmarks = getUserBookmarks();
    const tags = getUserTags();
    
    setUserBookmarksList(bookmarks);
    setUserTagsList(tags);
  }, [getUserBookmarks, getUserTags]);

  const handleCopyLink = (bookmark: Bookmark) => {
    navigator.clipboard.writeText(bookmark.url);
    toast.success('링크가 복사되었습니다! 🎉', {
      duration: 3000,
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
  };
  
  const handleRemoveTag = (bookmarkId: string, tagId: string) => {
    const bookmark = userBookmarksList.find(b => b.id === bookmarkId);
    if (!bookmark) return;
    
    const updatedTagList = bookmark.tagList.filter(tag => tag.id !== tagId);
    updateBookmark(bookmarkId, { tagList: updatedTagList });
    
    // 상태 업데이트
    setUserBookmarksList(prevBookmarks => 
      prevBookmarks.map(b => 
        b.id === bookmarkId 
          ? { ...b, tagList: updatedTagList } 
          : b
      )
    );
  };
  
  const handleDeleteTag = (tagId: string) => {
    const tag = userTagsList.find(t => t.id === tagId);
    if (tag) {
      setShowDeleteTagModal(true);
      setTagToDelete({ id: tagId, name: tag.name });
    }
  };

  const confirmDeleteTag = () => {
    if (tagToDelete) {
      deleteTag(tagToDelete.id);
      
      // 삭제 성공 토스트 메시지
      toast.success(`"${tagToDelete.name}" 태그가 삭제되었습니다.`, {
        duration: 3000,
        position: 'bottom-center',
        style: {
          background: '#10B981',
          color: 'white',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 16px'
        },
        icon: '🗑️'
      });
      
      // 상태 업데이트
      setUserTagsList(prevTags => prevTags.filter(tag => tag.id !== tagToDelete.id));
      setUserBookmarksList(prevBookmarks => 
        prevBookmarks.map(bookmark => ({
          ...bookmark,
          tagList: bookmark.tagList.filter(tag => tag.id !== tagToDelete.id)
        }))
      );
      
      setShowDeleteTagModal(false);
      setTagToDelete(null);
    }
  };

  const cancelDeleteTag = () => {
    setShowDeleteTagModal(false);
    setTagToDelete(null);
  };

  const handleDeleteBookmark = (bookmark: Bookmark) => {
    setShowDeleteModal(true);
    setBookmarkToDelete(bookmark);
  };

  const confirmDeleteBookmark = () => {
    if (bookmarkToDelete) {
      deleteBookmark(bookmarkToDelete.id);
      
      // 삭제 성공 토스트 메시지
      toast.success(`"${bookmarkToDelete.title}" 북마크가 삭제되었습니다.`, {
        duration: 3000,
        position: 'bottom-center',
        style: {
          background: '#10B981',
          color: 'white',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          padding: '12px 16px'
        },
        icon: '🗑️'
      });
      
      // 상태 업데이트
      setUserBookmarksList(prevBookmarks => 
        prevBookmarks.filter(b => b.id !== bookmarkToDelete.id)
      );
      
      setShowDeleteModal(false);
      setBookmarkToDelete(null);
    }
  };

  const cancelDeleteBookmark = () => {
    setShowDeleteModal(false);
    setBookmarkToDelete(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">북마크</h1>
          <p className="text-sm text-gray-500">내 북마크 목록</p>
        </div>
        
        <div className="flex space-x-2">
          <Link
            href="/tag/manage"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            태그 관리
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
        {/* 로그인 안된 경우 로그인 권장 메시지 */}
        {isClient && !currentUser && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-amber-800">
              북마크를 관리하려면 <Link href="/login" className="font-bold underline">로그인</Link>이 필요합니다.
            </p>
          </div>
        )}
        
        {!isClient || userBookmarksList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {!isClient
              ? '로딩 중...'
              : currentUser 
              ? '등록된 북마크가 없습니다. 새 북마크를 추가해 보세요!'
              : '로그인 후 이용할 수 있습니다.'
            }
          </div>
        ) : (
          <div className="space-y-4">
            {userBookmarksList.map((bookmark) => (
              <div 
                key={bookmark.id || `temp-${Math.random()}`} 
                className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition group relative"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Link 
                      href={bookmark.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 hover:underline"
                    >
                      <h3 className="font-medium text-lg text-gray-900 group-hover:text-amber-600">
                        {bookmark.title}
                      </h3>
                      <span className="text-xs text-gray-500">↗</span>
                    </Link>
                    
                    {bookmark.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {bookmark.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {bookmark.tagList.map(tag => (
                        <span 
                          key={tag.id || `tag-${Math.random()}`} 
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                        >
                          {tag.name}
                          <button 
                            onClick={() => handleRemoveTag(bookmark.id, tag.id)}
                            className="ml-1 text-gray-500 hover:text-red-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => {
                        toggleFavorite(bookmark.id);
                        // 상태 업데이트
                        setUserBookmarksList(prevBookmarks => 
                          prevBookmarks.map(b => 
                            b.id === bookmark.id 
                              ? { ...b, isFavorite: !b.isFavorite } 
                              : b
                          )
                        );
                      }}
                      className={`p-1 rounded hover:bg-gray-100 ${bookmark.isFavorite ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
                      title={bookmark.isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
                    >
                      ★
                    </button>
                    
                    <button
                      onClick={() => handleCopyLink(bookmark)}
                      className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                      title="URL 복사"
                    >
                      📋
                    </button>
                    
                    {/* ID 값이 유효한 경우에만 Link 컴포넌트를 렌더링, key 속성 제거 */}
                    {bookmark.id ? (
                    <Link
                      href={`/bookmark/edit/${bookmark.id}`}
                      className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                      title="수정"
                    >
                      ✎
                    </Link>
                    ) : (
                      <button
                        className="p-1 rounded hover:bg-gray-100 text-gray-300 cursor-not-allowed"
                        title="유효하지 않은 북마크"
                        disabled
                      >
                        ✎
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        if (window.confirm('이 북마크를 삭제하시겠습니까?')) {
                          deleteBookmark(bookmark.id);
                          // 상태 업데이트
                          setUserBookmarksList(prevBookmarks => 
                            prevBookmarks.filter(b => b.id !== bookmark.id)
                          );
                        }
                      }}
                      className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600"
                      title="삭제"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && bookmarkToDelete && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={cancelDeleteBookmark}
          onConfirm={confirmDeleteBookmark}
          title="북마크 삭제"
          message={`"${bookmarkToDelete.title}" 북마크를 삭제하시겠습니까?`}
          confirmText="삭제하기"
          cancelText="취소"
          confirmButtonColor="bg-red-600 hover:bg-red-700"
        />
      )}

      {/* 태그 삭제 확인 모달 */}
      {showDeleteTagModal && tagToDelete && (
        <ConfirmModal
          isOpen={showDeleteTagModal}
          onClose={cancelDeleteTag}
          onConfirm={confirmDeleteTag}
          title="태그 삭제"
          message={`"${tagToDelete.name}" 태그를 삭제하시겠습니까?`}
          confirmText="삭제하기"
          cancelText="취소"
          confirmButtonColor="bg-red-600 hover:bg-red-700"
        />
      )}
    </div>
  );
} 