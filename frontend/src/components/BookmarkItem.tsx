'use client';

import React from 'react';
import { Bookmark, Tag } from '@/types';
import { useBookmarkStore } from '@/store/useBookmarkStore';

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
  
  // 소유자가 아니고, 읽기 전용도 아니라면 소유권을 검사
  const effectiveReadOnly = isReadOnly || (!isOwner && (currentUser?.id !== bookmark.userId));
  
  const handleToggleFavorite = () => {
    if (effectiveReadOnly) return;
    toggleFavorite(bookmark.id);
  };
  
  const handleDelete = () => {
    if (effectiveReadOnly) return;
    
    if (window.confirm(`"${bookmark.title}" 북마크를 삭제하시겠습니까?`)) {
      deleteBookmark(bookmark.id);
    }
  };
  
  const handleClick = () => {
    addRecentView(bookmark.id);
    window.open(bookmark.url, '_blank');
  };
  
  return (
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
  );
}; 