'use client';

import React, { useState } from 'react';
import { Bookmark, Tag } from '@/types';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { ConfirmModal } from './ConfirmModal';
import { toast } from 'react-hot-toast';

interface BookmarkItemProps {
  bookmark: Bookmark;
  isReadOnly?: boolean;
  isOwner?: boolean;
}

export const BookmarkItem: React.FC<BookmarkItemProps> = ({ 
  bookmark, 
  isReadOnly = false,
  isOwner = false
}) => {
  const { toggleFavorite, deleteBookmark, addRecentView, currentUser } = useBookmarkStore();
  
  // 삭제 확인 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // 소유자가 아니고, 읽기 전용도 아니라면 소유권을 검사
  const effectiveReadOnly = isReadOnly || (!isOwner && (currentUser?.id !== bookmark.userId));
  
  const handleToggleFavorite = () => {
    if (effectiveReadOnly) return;
    toggleFavorite(bookmark.id);
  };
  
  const handleDelete = () => {
    if (effectiveReadOnly) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    deleteBookmark(bookmark.id);
    
    // 삭제 성공 토스트 메시지
    toast.success(`"${bookmark.title}" 북마크가 삭제되었습니다.`, {
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
    
    setShowDeleteModal(false);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };
  
  const handleClick = () => {
    addRecentView(bookmark.id);
    window.open(bookmark.url, '_blank');
  };
  
  return (
    <>
      <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-semibold truncate mb-2 flex-1">
            <button onClick={handleClick} className="text-left hover:text-blue-600 transition-colors">
              {bookmark.title}
            </button>
          </h3>
          {!effectiveReadOnly && (
            <div className="flex space-x-2">
              <button
                onClick={handleToggleFavorite}
                className="p-1 rounded hover:bg-gray-100"
                aria-label={bookmark.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              >
                {bookmark.isFavorite ? (
                  <span className="text-yellow-400">★</span>
                ) : (
                  <span className="text-gray-400">☆</span>
                )}
              </button>
              <button
                onClick={handleDelete}
                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-500"
                aria-label="삭제"
              >
                ×
              </button>
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-2 truncate">
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-gray-500">
            {bookmark.url}
          </a>
        </p>
        
        {bookmark.description && (
          <p className="text-sm text-gray-700 mb-3 line-clamp-2">{bookmark.description}</p>
        )}
        
        {bookmark.tagList.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {bookmark.tagList.map((tag) => (
              <span 
                key={tag.id} 
                className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
        
        <div className="mt-3 text-xs text-gray-500">
          {new Date(bookmark.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="북마크 삭제"
        message={`"${bookmark.title}" 북마크를 삭제하시겠습니까?`}
        confirmText="삭제하기"
        cancelText="취소"
        confirmButtonColor="bg-red-600 hover:bg-red-700"
      />
    </>
  );
}; 