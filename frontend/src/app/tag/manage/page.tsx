'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { Tag } from '@/types';

export default function TagManagePage() {
  const { 
    getUserTags, 
    deleteTag, 
    addTag,
    currentUser 
  } = useBookmarkStore();
  
  const [newTagName, setNewTagName] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // 사용자의 태그 가져오기
  const userTags = getUserTags();
  
  const handleAddTag = () => {
    if (!newTagName.trim()) {
      setError('태그 이름을 입력해주세요');
      return;
    }
    
    // 이미 존재하는 태그인지 확인
    if (userTags.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
      setError('이미 추가된 태그입니다');
      return;
    }
    
    // 태그 추가
    addTag(newTagName);
    setNewTagName('');
    setError(null);
  };
  
  const handleDeleteTag = (tagId: string, tagName: string) => {
    if (window.confirm(`"${tagName}" 태그를 삭제하시겠습니까? 이 태그를 사용하는 모든 북마크와 카테고리에서도 제거됩니다.`)) {
      deleteTag(tagId);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">태그 관리</h1>
          <p className="text-sm text-gray-500">태그를 추가하거나 삭제할 수 있습니다</p>
        </div>
        
        <Link
          href="/bookmark"
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          북마크 목록으로 돌아가기
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* 로그인 안된 경우 로그인 권장 메시지 */}
        {!currentUser && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-amber-800">
              태그를 관리하려면 <Link href="/login" className="font-bold underline">로그인</Link>이 필요합니다.
            </p>
          </div>
        )}
        
        {/* 태그 추가 폼 */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">새 태그 추가</h2>
          <div className="flex">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="새 태그 이름"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-amber-600 text-white rounded-r-lg hover:bg-amber-700"
            >
              추가
            </button>
          </div>
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
        
        {/* 태그 목록 */}
        <div>
          <h2 className="text-lg font-semibold mb-4">태그 목록</h2>
          
          {userTags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 태그가 없습니다. 새 태그를 추가해 보세요!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {userTags.map((tag: Tag) => (
                <div 
                  key={tag.id} 
                  className="flex justify-between items-center p-3 border border-gray-200 rounded-lg hover:shadow-sm"
                >
                  <span className="font-medium">{tag.name}</span>
                  <button
                    onClick={() => handleDeleteTag(tag.id, tag.name)}
                    className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600"
                    title="태그 삭제"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 