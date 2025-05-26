'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { Category, Tag } from '@/types';

interface CategoryFormProps {
  category?: Category;
  onSuccess?: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ category, onSuccess }) => {
  const { 
    getUserTags, 
    addTag, 
    addCategory, 
    updateCategory, 
    currentUser,
    loadUserCategories,
    loadUserTags 
  } = useBookmarkStore();
  
  // 현재 사용자의 태그만 가져오기
  const userTags = getUserTags();
  
  const [title, setTitle] = useState(category?.title || '');
  const [selectedTags, setSelectedTags] = useState<Tag[]>(category?.tagList || []);
  const [newTagName, setNewTagName] = useState('');
  const [isPublic, setIsPublic] = useState(category?.isPublic ?? true);
  const [errors, setErrors] = useState<{
    title?: string;
    tag?: string;
  }>({});
  
  // category가 변경될 때 selectedTags 업데이트 (편집 시 필수)
  useEffect(() => {
    if (category?.tagList) {
      setSelectedTags(category.tagList);
    }
  }, [category]);
  
  // 사용 가능한 태그 목록을 메모이제이션으로 계산 (무한 루프 방지)
  const availableTags = useMemo(() => {
    return userTags.filter(
      tag => !selectedTags.some(selected => selected.id === tag.id)
    );
  }, [
    userTags.length, 
    selectedTags.length,
    // 선택된 태그 ID들의 정렬된 문자열로 변경 감지
    selectedTags.map(t => t.id).sort().join(','),
    // 사용자 태그 ID들의 정렬된 문자열로 변경 감지  
    userTags.map(t => t.id).sort().join(',')
  ]);
  
  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    
    // 이미 선택된 태그인지 확인
    if (selectedTags.some(tag => tag.name.toLowerCase() === newTagName.toLowerCase())) {
      setErrors({...errors, tag: '이미 추가된 태그입니다'});
      return;
    }
    
    // 이미 존재하는 태그인지 확인
    const existingTag = userTags.find(tag => tag.name.toLowerCase() === newTagName.toLowerCase());
    
    if (existingTag) {
      // 이미 선택된 태그인지 다시 확인 
      if (selectedTags.some(tag => tag.id === existingTag.id)) {
        setErrors({...errors, tag: '이미 추가된 태그입니다'});
        return;
      }
      
      const newSelectedTags = [...selectedTags, existingTag];
      setSelectedTags(newSelectedTags);
      
      setErrors({...errors, tag: undefined});
    } else {
      try {
        // await로 비동기 함수 처리
        const newTag = await addTag(newTagName);
        
        // 태그 추가 후 백엔드에서 최신 태그 데이터 다시 로드
        await loadUserTags();
        
        const newSelectedTags = [...selectedTags, newTag];
        setSelectedTags(newSelectedTags);
        
        setErrors({...errors, tag: undefined});
      } catch (error) {
        setErrors({...errors, tag: '태그 추가 중 오류가 발생했습니다'});
      }
    }
    
    setNewTagName('');
  };
  
  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };
  
  const validateForm = () => {
    const newErrors: {title?: string} = {};
    
    if (!title.trim()) {
      newErrors.title = '카테고리 이름을 입력해주세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (category) {
        // 수정
        await updateCategory(category.id, {
          title,
          tagList: selectedTags,
          isPublic
        });
        // 카테고리 수정 후 백엔드에서 최신 데이터 다시 로드
        await loadUserCategories();
      } else {
        // 새 카테고리 추가
        await addCategory({
          title,
          tagList: selectedTags,
          isPublic,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any); // 타입 오류 해결을 위해 타입 단언 사용
        // 카테고리 추가 후 백엔드에서 최신 데이터 다시 로드
        await loadUserCategories();
      }
      
      // 성공 콜백
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('카테고리 저장 중 오류:', error);
      // 오류 처리 (필요시 사용자에게 알림)
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          카테고리 이름 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="카테고리 이름"
        />
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
      </div>
      
      <div className="flex items-center">
        <input
          type="checkbox"
          id="isPublic"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
        />
        <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700">
          공개 카테고리로 설정
        </label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          태그
        </label>
        <div className="flex">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                await handleAddTag();
              }
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="새 태그"
          />
          <button
            type="button"
            onClick={async () => await handleAddTag()}
            className="px-4 py-2 bg-gray-700 text-white rounded-r-lg hover:bg-gray-800"
          >
            추가
          </button>
        </div>
        {errors.tag && <p className="mt-1 text-sm text-red-500">{errors.tag}</p>}
        
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTags.map(tag => (
              <span 
                key={tag.id || `selected-tag-${Math.random()}`} 
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm flex items-center"
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        
        {userTags.length > 0 && availableTags.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-1">기존 태그:</p>
            <div className="flex flex-wrap gap-1">
              {availableTags.map(tag => (
                  <button
                  key={tag.id || `tag-option-${Math.random()}`}
                    type="button"
                  onClick={() => {
                    // 새 선택된 태그 배열 생성
                    const newSelectedTags = [...selectedTags, tag];
                    // 상태 업데이트 (이렇게 하면 리렌더링 발생)
                    setSelectedTags(newSelectedTags);
                  }}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-gray-200"
                  >
                    {tag.name}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="pt-4">
        <button
          type="submit"
          className="w-full py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
        >
          {category ? '카테고리 수정' : '카테고리 추가'}
        </button>
      </div>
    </form>
  );
}; 