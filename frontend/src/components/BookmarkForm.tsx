'use client';

import React, { useState, useEffect } from 'react';
import { useBookmarkStore } from '@/store/useBookmarkStore';
import { Bookmark, Tag } from '@/types';

interface BookmarkFormProps {
  bookmark?: Bookmark;
  onSuccess?: () => void;
}

export const BookmarkForm: React.FC<BookmarkFormProps> = ({ bookmark, onSuccess }) => {
  const { 
    addBookmark, 
    updateBookmark, 
    getUserTags, 
    addTag, 
    currentUser 
  } = useBookmarkStore();
  
  // 현재 사용자의 태그만 가져오기
  const userTags = getUserTags();
  
  const [title, setTitle] = useState(bookmark?.title || '');
  const [url, setUrl] = useState(bookmark?.url || '');
  const [description, setDescription] = useState(bookmark?.description || '');
  const [selectedTags, setSelectedTags] = useState<Tag[]>(bookmark?.tagList || []);
  const [newTagName, setNewTagName] = useState('');
  const [errors, setErrors] = useState<{
    title?: string;
    url?: string;
    tag?: string;
  }>({});
  
  // 사용 가능한 태그 목록을 위한 상태 추가
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  
  // 컴포넌트 마운트 시 한 번만 사용자 태그 목록 설정
  useEffect(() => {
    // 사용 가능한 태그 목록 초기화
    const filteredTags = userTags.filter(
      tag => !selectedTags.some(selected => selected.id === tag.id)
    );
    setAvailableTags(filteredTags);
  }, []);
  
  // selectedTags만 의존성 배열에 포함하여 무한 루프 방지
  useEffect(() => {
    // 선택된 태그가 변경될 때만 available 태그 다시 계산
    const filteredTags = userTags.filter(
      tag => !selectedTags.some(selected => selected.id === tag.id)
    );
    setAvailableTags(filteredTags);
  }, [selectedTags]);
  
  // URL 자동 채우기 기능
  const handlePasteUrl = async () => {
    try {
      // 클립보드 API 사용 시 발생할 수 있는 오류 처리
      if (!navigator.clipboard) {
        console.warn("클립보드 API를 사용할 수 없습니다.");
        return;
      }
      
      try {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText.startsWith('http')) {
          setUrl(clipboardText);
          
          // 페이지 제목 자동 가져오기 (실제로는 백엔드 API를 통해 처리할 예정)
          // 현재는 플레이스홀더 로직만 구현
          if (!title) {
            setTitle(`북마크 - ${new Date().toLocaleDateString()}`);
          }
        }
      } catch (clipboardErr) {
        console.warn("클립보드 접근 권한이 없습니다. 수동으로 URL을 입력해주세요.", clipboardErr);
        alert("클립보드 접근 권한이 없습니다. 보안 정책으로 인해 수동으로 URL을 입력해주세요.");
      }
    } catch (err) {
    }
  };
  
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
        const newTag = await addTag(newTagName);
        const newSelectedTags = [...selectedTags, newTag];
        setSelectedTags(newSelectedTags);
        setErrors({...errors, tag: undefined});
      } catch (error) {
        setErrors({...errors, tag: '태그 추가에 실패했습니다'});
        return;
      }
    }
    
    setNewTagName('');
  };
  
  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };
  
  const validateForm = () => {
    const newErrors: {title?: string; url?: string} = {};
    
    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    }
    
    if (!url.trim()) {
      newErrors.url = 'URL을 입력해주세요';
    } else if (!/^https?:\/\//.test(url)) {
      newErrors.url = 'URL은 http:// 또는 https://로 시작해야 합니다';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (bookmark) {
      // 수정
      updateBookmark(bookmark.id, {
        title,
        url,
        description,
        tagList: selectedTags
      });
    } else {
      // 새 북마크 추가
      addBookmark({
        title,
        url,
        description,
        tagList: selectedTags,
        categoryId: null,
        integrated: false,
        updatedAt: new Date().toISOString()
      });
    }
    
    // 폼 초기화
    if (!bookmark) {
      setTitle('');
      setUrl('');
      setDescription('');
      setSelectedTags([]);
    }
    
    if (onSuccess) {
      onSuccess();
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="북마크 제목"
        />
        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
      </div>
      
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
          URL <span className="text-red-500">*</span>
        </label>
        <div className="flex">
          <input
            type="text"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={`flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-amber-400 ${
              errors.url ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://example.com"
          />
          <button
            type="button"
            onClick={handlePasteUrl}
            className="px-4 py-2 bg-gray-100 border border-l-0 rounded-r-lg hover:bg-gray-200"
          >
            붙여넣기
          </button>
        </div>
        {errors.url && <p className="mt-1 text-sm text-red-500">{errors.url}</p>}
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          설명
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          placeholder="북마크에 대한 메모나 설명을 입력하세요"
        />
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
                    const newSelectedTags = [...selectedTags, tag];
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
          {bookmark ? '북마크 수정' : '북마크 추가'}
        </button>
      </div>
    </form>
  );
}; 