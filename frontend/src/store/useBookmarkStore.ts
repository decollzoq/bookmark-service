import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { Bookmark, Tag, Category, SharedLink, RecentView, User } from '@/types';
import React from 'react';
import apiClient from '@/api/apiClient';
import { jwtDecode } from 'jwt-decode';
import bookmarkService, { Tag as ApiTag } from '@/api/bookmarkService';
import tagService from '@/api/tagService';
import categoryService from '@/api/categoryService';

// JWT 토큰에서 ID 추출 유틸리티 함수
const getIdFromToken = (token: string): string | null => {
  try {
    const decoded = jwtDecode(token) as any;
    return decoded.sub || null;
  } catch (e) {
    console.error('토큰에서 ID 추출 실패:', e);
    return null;
  }
};

// 안전한 localStorage 접근 함수
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }
};

// JWT 토큰에서 사용자 정보 추출 유틸리티 함수
const extractUserFromToken = (token: string, userEmail?: string): User | null => {
  try {
    const decoded = jwtDecode(token) as any;
    // 사용자 이메일은 입력된 이메일이나 localStorage에 저장된 이메일을 우선 사용
    const email = userEmail || safeLocalStorage.getItem('userEmail') || decoded.email || decoded.sub || '';
    const username = email.split('@')[0]; // 이메일의 @ 앞부분만 사용자 이름으로 사용
    
    return {
      id: decoded.sub || ('user-' + Date.now()),
      username: username,
      email: email
    };
  } catch (e) {
    console.error('토큰 디코딩 실패:', e);
    return null;
  }
};

// API 응답에서 받을 수 있는 태그 타입
interface LocalApiTag {
  id: string;
  name: string;
}

// API 응답의 태그 데이터를 내부 Tag 형식으로 변환
const convertApiTagToTag = (apiTag: LocalApiTag | string, userId: string): Tag => {
  // 문자열인 경우 (백엔드가 태그 이름 문자열을 반환할 수 있음)
  if (typeof apiTag === 'string') {
    return {
      id: '', // 임시 ID (실제로는 찾거나 생성해야 할 수 있음)
      name: apiTag,
      userId
    };
  }
  
  // 객체인 경우 (일반적인 태그 객체)
  return {
    id: apiTag.id,
    name: apiTag.name,
    userId
  };
};

// 다양한 형태의 태그 데이터를 처리하는 함수
const convertTagData = (tagData: any, userId: string): Tag[] => {
  if (!tagData) return [];
  
  // 배열이 아닌 경우 빈 배열 반환
  if (!Array.isArray(tagData)) return [];
  
  // 배열이 비어있는 경우
  if (tagData.length === 0) return [];
  
  // 문자열 또는 객체 배열을 Tag 객체 배열로 변환
  return tagData.map(tag => convertApiTagToTag(tag, userId));
};

interface BookmarkState {
  bookmarks: Bookmark[];
  categories: Category[];
  tags: Tag[];
  sharedLinks: SharedLink[];
  recentViews: RecentView[];
  currentUser: User | null;
  
  // 하이드레이션 상태 추가
  hydrated: boolean;
  
  // 북마크 관련 함수
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'userId'>) => Promise<Bookmark>;
  updateBookmark: (id: string, bookmark: Partial<Bookmark>) => void;
  deleteBookmark: (id: string) => void;
  toggleFavorite: (id: string) => void;
  // 북마크 복사 함수 추가
  copyBookmark: (bookmarkId: string) => Promise<Bookmark | null>;
  // 현재 사용자의 북마크만 가져오는 함수
  getUserBookmarks: () => Bookmark[];
  
  // 카테고리 관련 함수
  addCategory: (category: Omit<Category, 'id'>) => Promise<string | null>;
  updateCategory: (categoryId: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  // 카테고리 복사 함수 추가
  copyCategory: (categoryId: string, options?: { withNewTitle?: boolean }) => Promise<string | null>;
  // 현재 사용자의 카테고리만 가져오는 함수
  getUserCategories: () => Category[];
  
  // 태그 관련 함수
  addTag: (name: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  // 태그 찾기 또는 생성 함수 추가
  findOrCreateTag: (name: string) => Promise<Tag>;
  // 현재 사용자의 북마크와 카테고리에 연결된 태그만 가져오는 함수
  getUserTags: () => Tag[];
  
  // 공유 링크 관련 함수
  createShareLink: (params: { bookmarkId?: string; categoryId?: string }) => SharedLink;
  getShareLinkByUuid: (uuid: string) => any;
  
  // 최근 조회 관련 함수
  addRecentView: (bookmarkId: string) => void;
  // 현재 사용자의 최근 조회만 가져오는 함수
  getUserRecentViews: () => RecentView[];
  
  // 로그인/로그아웃 (목업 기능)
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  
  // 북마크와 카테고리 연결 함수 추가
  importCategoryWithBookmarks: (categoryId: string) => Promise<Category | null>;

  verifyEmail: (email: string, code: string) => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  
  // 비밀번호 찾기 및 재설정 함수 추가
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;

  // 특정 카테고리와 관련된 북마크 가져오기 (카테고리 ID 또는 태그 기반)
  getCategoryBookmarks: (categoryId: string) => Bookmark[];
  
  // 계정 탈퇴 함수
  deleteAccount: (password: string) => Promise<void>;

  // 백엔드에서 북마크 데이터 로드
  loadUserBookmarks: () => Promise<Bookmark[]>;

  // 백엔드에서 카테고리 데이터 로드
  loadUserCategories: () => Promise<Category[]>;
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      categories: [],
      tags: [],
      sharedLinks: [],
      recentViews: [],
      currentUser: null,
      hydrated: false,
      
      // 백엔드에서 북마크 데이터 로드
      loadUserBookmarks: async (): Promise<Bookmark[]> => {
        try {
          const currentUser = get().currentUser;
          console.log('loadUserBookmarks 호출됨, 현재 사용자:', currentUser);
          
          if (!currentUser) {
            console.log('사용자가 로그인되어 있지 않아 북마크를 로드할 수 없습니다.');
            return [];
          }
          
          console.log('북마크 API 호출 시도...');
          const response = await bookmarkService.getAllBookmarks();
          console.log('북마크 API 응답 받음:', response);
          
          // 응답이 없거나 배열이 아닌 경우 빈 배열 반환
          if (!response || !Array.isArray(response)) {
            console.error('백엔드에서 유효하지 않은 응답:', response);
            return [];
          }
          
          // 백엔드에서 받은 데이터를 프론트엔드 형식으로 변환
          const bookmarks: Bookmark[] = response.map(item => {
            // 태그 데이터 처리 (tags 또는 tagNames 필드 모두 처리)
            const tagData = item.tags || item.tagNames || [];
            console.log('북마크 태그 데이터:', item.id, tagData);
            
            return {
              id: item.id,
              title: item.title,
              url: item.url,
              description: item.description || '',
              categoryId: item.categoryId || '',
              tagList: convertTagData(tagData, currentUser.id),
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              isFavorite: item.isFavorite,
              userId: currentUser.id,
              integrated: false
            };
          });
          
          set({ bookmarks });
          return bookmarks;
        } catch (error) {
          console.error('북마크 로드 실패:', error);
          return [];
        }
      },
      
      // 백엔드에서 카테고리 데이터 로드
      loadUserCategories: async (): Promise<Category[]> => {
        try {
          const currentUser = get().currentUser;
          if (!currentUser) return [];
          
          const response = await categoryService.getAllCategories();
          
          // 응답이 없거나 배열이 아닌 경우 빈 배열 반환
          if (!response || !Array.isArray(response)) {
            console.error('백엔드에서 유효하지 않은 카테고리 응답:', response);
            return [];
          }
          
          // 백엔드에서 받은 데이터를 프론트엔드 형식으로 변환
          const categories: Category[] = response.map(item => {
            // 태그 데이터 처리 (tags 또는 tagNames 필드 모두 처리)
            const tagData = item.tags || item.tagNames || [];
            console.log('카테고리 태그 데이터:', item.id, tagData);
            
            // 태그 데이터 변환 (문자열 또는 객체 형식 모두 처리)
            const tagList = tagData.map((tagItem: any) => {
              // 문자열인 경우 (태그 이름만 있는 경우)
              if (typeof tagItem === 'string') {
                return {
                  id: `tag-${Math.random()}`,
                  name: tagItem,
                  userId: currentUser.id
                };
              }
              // 객체인 경우 (id와 name이 있는 경우)
              return {
                id: tagItem.id || `tag-${Math.random()}`,
                name: tagItem.name || '무제 태그',
                userId: currentUser.id
              };
            });
            
            return {
              id: item.id,
              title: item.title,
              tagList: tagList,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt || item.createdAt,
              userId: currentUser.id,
              isPublic: item.isPublic
            };
          });
          
          set({ categories });
          return categories;
        } catch (error) {
          console.error('카테고리 로드 실패:', error);
          return [];
        }
      },
      
      // 사용자별 북마크 조회 함수
      getUserBookmarks: () => {
        const { bookmarks, currentUser } = get();
        if (!currentUser) return [];
        return bookmarks.filter(bookmark => bookmark.userId === currentUser.id);
      },
      
      // 특정 카테고리와 관련된 북마크 가져오기 (카테고리 ID 또는 태그 기반)
      getCategoryBookmarks: (categoryId) => {
        const { bookmarks, categories, currentUser } = get();
        
        // 카테고리 찾기
        const category = categories.find(c => c.id === categoryId);
        if (!category) {
          console.log('카테고리를 찾을 수 없음:', categoryId);
          return [];
        }
        
        // 디버깅 로그
        console.log('=== getCategoryBookmarks ===');
        console.log('카테고리:', category.title);
        console.log('카테고리 ID:', category.id);
        
                  // 카테고리의 태그 정보 자세히 로깅
          if (category.tagList && category.tagList.length > 0) {
            console.log('카테고리 태그 수:', category.tagList.length);
            console.log('카테고리 태그 상세:', category.tagList.map(tag => {
              // 태그가 문자열인 경우 처리
              if (typeof tag === 'string') {
                return { id: '없음', name: tag, type: 'string' };
              }
              // 태그가 객체인 경우
              return {
                id: tag.id || '없음',
                name: tag.name || '없음',
                type: typeof tag
              };
            }));
          } else {
            console.log('카테고리에 태그가 없음');
          }
        
        // 1. 먼저 직접 카테고리 ID로 연결된 북마크 찾기
        const directBookmarks = bookmarks.filter(bookmark => 
          bookmark.categoryId === categoryId
        );
        
        // 2. 카테고리 태그와 일치하는 북마크 찾기
        let tagMatchedBookmarks: Bookmark[] = [];
        
        // 태그 기반 매칭은 카테고리에 태그가 있는 경우에만 수행
        if (category.tagList && category.tagList.length > 0) {
          // 카테고리 태그의 ID와 이름 집합 생성 (이중 매칭을 위해)
          const categoryTagIds = new Set(
            category.tagList
              .filter(tag => {
                // 태그가 객체이고 id 필드가 있는 경우만 포함
                return tag && typeof tag === 'object' && 'id' in tag && tag.id;
              })
              .map(tag => (tag as Tag).id)
          );
          
          const categoryTagNames = new Set(
            category.tagList
              .filter(tag => {
                // 태그가 문자열이면 그대로 사용
                if (typeof tag === 'string') return true;
                // 태그가 객체이고 name 필드가 있는 경우 포함
                return tag && typeof tag === 'object' && 'name' in tag && tag.name;
              })
              .map(tag => {
                // 태그가 문자열이면 그대로 반환
                if (typeof tag === 'string') return tag.toLowerCase();
                // 태그가 객체이면 name 필드 반환
                return (tag as Tag).name.toLowerCase();
              })
          );
          
          // 강제 문자열 변환을 통해 로그 출력 (타입 오류 방지)
          console.log('카테고리 태그 ID 집합:', JSON.stringify([...categoryTagIds]));
          console.log('카테고리 태그 이름 집합:', JSON.stringify([...categoryTagNames]));
          
          // 북마크 태그 매칭 로직
          tagMatchedBookmarks = bookmarks.filter(bookmark => {
            // 이미 직접 연결된 북마크는 제외
            if (bookmark.categoryId === categoryId) return false;
            
            // 북마크에 태그가 없는 경우 매칭되지 않음
            if (!bookmark.tagList || bookmark.tagList.length === 0) return false;
            
            // 북마크 태그 정보 로깅 (디버깅 용)
            if (bookmark.id.includes('debug')) {
              console.log('북마크 태그 검사:', bookmark.title, bookmark.tagList);
            }
            
                          // 태그 매칭 (ID 또는 이름으로 매칭)
              for (const bookmarkTag of bookmark.tagList) {
                if (!bookmarkTag) continue;
                
                // 태그가 문자열인 경우
                if (typeof bookmarkTag === 'string') {
                  if (categoryTagNames.has(bookmarkTag.toLowerCase())) {
                    console.log(`태그 이름 매칭 (문자열): 북마크 "${bookmark.title}"(${bookmark.id})의 태그 "${bookmarkTag}"`);
                    return true;
                  }
                  continue;
                }
                
                // 태그가 객체인 경우
                
                // ID로 매칭
                if (bookmarkTag.id && categoryTagIds.has(bookmarkTag.id)) {
                  console.log(`태그 ID 매칭: 북마크 "${bookmark.title}"(${bookmark.id})의 태그 ID "${bookmarkTag.id}"`);
                  return true;
                }
                
                // 이름으로 매칭 (대소문자 구분 없이)
                if (bookmarkTag.name && categoryTagNames.has(bookmarkTag.name.toLowerCase())) {
                  console.log(`태그 이름 매칭: 북마크 "${bookmark.title}"(${bookmark.id})의 태그 "${bookmarkTag.name}"`);
                  return true;
                }
              }
            
            return false;
          });
        
          console.log(`태그 매칭된 북마크 수: ${tagMatchedBookmarks.length}`);
          if (tagMatchedBookmarks.length > 0) {
            console.log('태그 매칭된 북마크:', tagMatchedBookmarks.map(b => b.title));
          }
        } else {
          console.log('카테고리에 태그가 없음, 태그 매칭 건너뜀');
        }
        
        console.log('직접 연결된 북마크 수:', directBookmarks.length);
        if (directBookmarks.length > 0) {
          console.log('직접 연결된 북마크:', directBookmarks.map(b => b.title));
        }
        
        // 3. 두 결과 합치기
        const result = [...directBookmarks, ...tagMatchedBookmarks];
        console.log(`총 반환 북마크 수: ${result.length}`);
        console.log('=== getCategoryBookmarks 종료 ===');
        
        return result;
      },
      
      // 사용자별 카테고리 조회 함수
      getUserCategories: () => {
        const { categories, currentUser } = get();
        
        if (!currentUser) {
          return [];
        }
        
        return categories.filter(category => 
          category.userId === currentUser.id
        );
      },
      
      // 사용자별 태그 조회 함수 
      getUserTags: () => {
        const { tags, currentUser } = get();
        if (!currentUser) return [];
        
        // 현재 사용자가 소유한 태그만 반환
        return tags.filter(tag => tag.userId === currentUser.id);
      },
      
      // 사용자별 최근 조회 가져오기
      getUserRecentViews: () => {
        const { recentViews, bookmarks, currentUser } = get();
        if (!currentUser) return [];
        
        // 현재 사용자의 북마크 IDs
        const userBookmarkIds = new Set(
          bookmarks
            .filter(b => b.userId === currentUser.id)
            .map(b => b.id)
        );
        
        // 사용자의 북마크와 관련된 최근 조회만 반환
        return recentViews.filter(rv => userBookmarkIds.has(rv.bookmarkId));
      },
      
      addBookmark: async (bookmarkData) => {
        const currentUser = get().currentUser;
        const userId = currentUser?.id || 'anonymous';
        
        try {
          // 1. 태그 정보를 태그 이름 배열로 변환
          const tagNames = bookmarkData.tagList?.map(tag => tag.name) || [];
          
          console.log('태그 이름 배열:', tagNames);
          
          // 2. 백엔드 API 호출
          return bookmarkService.createBookmark({
            title: bookmarkData.title,
            url: bookmarkData.url,
            description: bookmarkData.description,
            categoryId: bookmarkData.categoryId || null, // null로 명시적 처리
            tagNames: tagNames // tags -> tagNames로 필드명 변경
          }).then(response => {
            console.log('북마크 생성 응답:', response);
            
            // 태그 데이터 처리 (tags 또는 tagNames 필드 모두 처리)
            const tagData = response.tags || response.tagNames || [];
            
            // 3. 응답 데이터로 Bookmark 객체 생성
        const newBookmark: Bookmark = {
              id: response.id,
              title: response.title,
              url: response.url,
              description: response.description || '',
              categoryId: response.categoryId || null, // null로 명시적 처리
              tagList: tagData.map(tag => ({
                id: tag.id,
                name: tag.name,
                userId
              })),
              createdAt: response.createdAt,
              updatedAt: response.updatedAt || response.createdAt,
              isFavorite: response.isFavorite,
          userId: userId,
              integrated: bookmarkData.integrated || false
        };
        
            console.log('생성된 북마크 객체:', newBookmark);
            
            // 4. 상태 업데이트
        set((state) => ({ 
          bookmarks: [...state.bookmarks, newBookmark],
          recentViews: [
            { 
              id: uuidv4(), 
              bookmarkId: newBookmark.id, 
              viewedAt: new Date().toISOString() 
            },
            ...state.recentViews
          ].slice(0, 10) // 최대 10개까지만 유지
        }));
        
        return newBookmark;
          });
        } catch (error) {
          console.error('북마크 생성 실패:', error);
          throw error;
        }
      },
      
      updateBookmark: async (id, bookmarkData) => {
        const { currentUser, bookmarks } = get();
        
        // 북마크 소유자 검증
        const bookmark = bookmarks.find(b => b.id === id);
        if (!bookmark || (currentUser && bookmark.userId !== currentUser.id)) {
          console.error('해당 북마크를 수정할 권한이 없습니다.');
          return;
        }
        
        try {
          // 1. 태그 리스트를 태그 이름 배열로 변환
          const tagNames = bookmarkData.tagList?.map(tag => tag.name);
          
          console.log('수정할 북마크 ID:', id);
          console.log('수정할 태그 이름 배열:', tagNames);
          
          // 2. 백엔드 API 호출
          const updateData: any = {};
          if (bookmarkData.title) updateData.title = bookmarkData.title;
          if (bookmarkData.url) updateData.url = bookmarkData.url;
          if (bookmarkData.description !== undefined) updateData.description = bookmarkData.description;
          if (bookmarkData.categoryId !== undefined) updateData.categoryId = bookmarkData.categoryId;
          if (tagNames) updateData.tagNames = tagNames; // tags -> tagNames로 필드명 변경
          
          console.log('업데이트 데이터:', updateData);
          
          const response = await bookmarkService.updateBookmark(id, updateData);
          
          console.log('북마크 업데이트 응답:', response);
          
          // 태그 데이터 처리 (tags 또는 tagNames 필드 모두 처리)
          const tagData = response.tags || response.tagNames || [];
          
          // 3. 상태 업데이트
          set((state) => {
            // 응답의 tags를 tagList로 변환
            const updatedTags = tagData.map(tag => ({
              id: tag.id,
              name: tag.name,
              userId: currentUser?.id || 'anonymous'
            }));
            
            return {
          bookmarks: state.bookmarks.map(bookmark => 
                bookmark.id === id ? { 
                  ...bookmark, 
                  ...bookmarkData,
                  tagList: updatedTags,
                  updatedAt: response.updatedAt || new Date().toISOString()
                } : bookmark
          )
            };
          });
        } catch (error) {
          console.error('북마크 업데이트 실패:', error);
          throw error;
        }
      },
      
      deleteBookmark: async (id) => {
        const { currentUser, bookmarks } = get();
        
        // 북마크 소유자 검증
        const bookmark = bookmarks.find(b => b.id === id);
        if (!bookmark || (currentUser && bookmark.userId !== currentUser.id)) {
          console.error('해당 북마크를 삭제할 권한이 없습니다.');
          return;
        }
        
        try {
          // 1. 백엔드 API 호출
          await bookmarkService.deleteBookmark(id);
          
          // 2. 상태 업데이트
        set((state) => ({
          bookmarks: state.bookmarks.filter(bookmark => bookmark.id !== id),
          recentViews: state.recentViews.filter(rv => rv.bookmarkId !== id)
        }));
        } catch (error) {
          console.error('북마크 삭제 실패:', error);
          throw error;
        }
      },
      
      toggleFavorite: async (id) => {
        const { currentUser, bookmarks } = get();
        
        // 북마크 소유자 검증
        const bookmark = bookmarks.find(b => b.id === id);
        if (!bookmark || (currentUser && bookmark.userId !== currentUser.id)) {
          console.error('해당 북마크를 즐겨찾기 할 권한이 없습니다.');
          return;
        }
        
        try {
          // 1. 백엔드 API 호출
          await bookmarkService.toggleFavorite(id);
          
          // 2. 상태 업데이트
        set((state) => ({
          bookmarks: state.bookmarks.map(bookmark => 
            bookmark.id === id ? { ...bookmark, isFavorite: !bookmark.isFavorite } : bookmark
          )
        }));
        } catch (error) {
          console.error('즐겨찾기 토글 실패:', error);
          throw error;
        }
      },
      
      // 북마크 복사 함수
      copyBookmark: async (bookmarkId) => {
        const { currentUser, bookmarks } = get();
        if (!currentUser) return null;
        
        const originalBookmark = bookmarks.find(b => b.id === bookmarkId);
        if (!originalBookmark) return null;
        
        // 복사본 생성 및 추가
        const bookmarkCopy = {
          title: originalBookmark.title, // (복사본) 접미사 제거
          url: originalBookmark.url,
          description: originalBookmark.description,
          categoryId: originalBookmark.categoryId || null, // 명시적으로 null 처리
          tagList: [...originalBookmark.tagList],
          integrated: originalBookmark.integrated || false,
          updatedAt: new Date().toISOString()
        };
        
        return await get().addBookmark(bookmarkCopy);
      },
      
      addCategory: async (categoryData) => {
        console.log("addCategory 함수 호출됨:", categoryData);
        const currentUser = get().currentUser;
        
        if (!currentUser) {
          console.error("addCategory 실패: 로그인되지 않음");
          return null;
        }
        
        try {
        console.log("카테고리 추가 중, 현재 사용자:", currentUser);
          
          // 1. 태그 정보를 태그 이름 배열로 변환
          const tagNames = categoryData.tagList?.map(tag => tag.name) || [];
          console.log('태그 이름 배열:', tagNames);
          
          // 2. 백엔드 API 호출
          const response = await categoryService.createCategory({
            title: categoryData.title,
            isPublic: categoryData.isPublic || false,
            tagNames: tagNames // tags -> tagNames로 필드명 변경
          });
          
          console.log("백엔드 응답:", response);
          
          // 태그 데이터 처리 (tags 또는 tagNames 필드 모두 처리)
          let tagData: any[] = [];
          
          // 응답에서 태그 데이터 추출
          if (Array.isArray(response.tags)) {
            tagData = response.tags;
          } else if (Array.isArray(response.tagNames)) {
            tagData = response.tagNames;
          }
          
          // 3. 응답 데이터로 태그 목록 생성
          const tagList = tagData.map((tag: any) => {
            // 문자열인 경우 (태그 이름만 있는 경우)
            if (typeof tag === 'string') {
              return {
                id: `tag-${Math.random()}`,
                name: tag,
                userId: currentUser.id
              };
            }
            // 객체인 경우 (id와 name이 있는 경우)
            return {
              id: tag.id || `tag-${Math.random()}`,
              name: tag.name || '무제 태그',
              userId: currentUser.id
            };
          });
        
        const newCategory: Category = {
            id: response.id,
            title: response.title,
            isPublic: response.isPublic,
            tagList: tagList,
            createdAt: response.createdAt,
            updatedAt: response.updatedAt,
          userId: currentUser.id
        };
        
          console.log("생성된 카테고리:", newCategory);
        
          // 4. 상태 업데이트
        set((state) => {
          const updatedCategories = [...state.categories, newCategory];
          console.log("업데이트된 카테고리 목록 (개수):", updatedCategories.length);
          return { categories: updatedCategories };
        });
        
          return newCategory.id;
        } catch (error) {
          console.error("백엔드 카테고리 생성 실패:", error);
          
          // 오류 발생 시 로컬에만 저장 (오프라인 지원)
          const newCategory: Category = {
            id: uuidv4(),
            ...categoryData,
            userId: currentUser.id
          };
          
          set((state) => {
            const updatedCategories = [...state.categories, newCategory];
            return { categories: updatedCategories };
          });
        
        return newCategory.id;
        }
      },
      
      updateCategory: async (id, categoryData) => {
        const { currentUser, categories } = get();
        
        // 카테고리 소유자 검증
        const category = categories.find(c => c.id === id);
        if (!currentUser || !category || category.userId !== currentUser.id) {
          console.error('해당 카테고리를 수정할 권한이 없습니다.');
          return;
        }
        
        try {
          console.log('카테고리 업데이트 시작:', { id, categoryData });
          
          // 1. 태그 정보를 태그 이름 배열로 변환 (태그 필드가 있는 경우)
          const updateData: any = { ...categoryData };
          if (categoryData.tagList) {
            updateData.tagNames = categoryData.tagList.map(tag => tag.name); // tags -> tagNames로 필드명 변경
            console.log('수정할 태그 이름 배열:', updateData.tagNames);
            delete updateData.tagList; // API 호출 시 tagList 필드 제거
          }
          
          // 2. 백엔드 API 호출
          console.log('백엔드 API 호출 전 데이터:', updateData);
          const response = await categoryService.updateCategory(id, updateData);
          console.log("백엔드 응답:", response);
          
          // 태그 데이터 처리 (tags 또는 tagNames 필드 모두 처리)
          let tagData: any[] = [];
          
          // 응답에서 태그 데이터 추출
          if (Array.isArray(response.tags)) {
            console.log('백엔드 응답에서 tags 필드 발견');
            tagData = response.tags;
          } else if (Array.isArray(response.tagNames)) {
            console.log('백엔드 응답에서 tagNames 필드 발견');
            tagData = response.tagNames;
          } else {
            console.log('백엔드 응답에 태그 데이터 없음, 원본 태그 사용');
            // 원본 tagList에서 태그 데이터 사용
            if (categoryData.tagList) {
              tagData = categoryData.tagList;
            }
          }
          
          console.log('태그 데이터 처리 결과:', tagData);
          
          // 3. 상태 업데이트 - 응답에서 태그 정보 사용
          set((state) => {
            // 새로 생성할 태그 리스트
            const updatedTagList = tagData.map((tag: any) => {
              // 문자열인 경우 (태그 이름만 있는 경우)
              if (typeof tag === 'string') {
                return {
                  id: `tag-${Math.random()}`,
                  name: tag,
                  userId: currentUser.id
                };
              }
              // 객체인 경우 (id와 name이 있는 경우)
              return {
                id: tag.id || `tag-${Math.random()}`,
                name: tag.name || '무제 태그',
                userId: currentUser.id
              };
            });
            
            console.log('최종 업데이트할 태그 리스트:', updatedTagList);
            
            return {
              categories: state.categories.map(category => 
                category.id === id ? { 
                  ...category, 
                  ...categoryData,
                  // 응답에서 태그 정보 사용
                  tagList: updatedTagList
                } : category
              )
            };
          });
          
          console.log('카테고리 업데이트 완료');
        } catch (error) {
          console.error('카테고리 업데이트 실패:', error);
          
          // 오류 발생해도 UI 업데이트 (낙관적 업데이트)
        set((state) => ({
          categories: state.categories.map(category => 
            category.id === id ? { ...category, ...categoryData } : category
          )
        }));
        }
      },
      
      deleteCategory: async (id) => {
        const { currentUser, categories } = get();
        
        // 카테고리 소유자 검증
        const category = categories.find(c => c.id === id);
        if (!category || (currentUser && category.userId !== currentUser.id)) {
          console.error('해당 카테고리를 삭제할 권한이 없습니다.');
          return;
        }
        
        try {
          // 1. 백엔드 API 호출
          await categoryService.deleteCategory(id);
          
          // 2. 상태 업데이트
        set((state) => ({
          categories: state.categories.filter(category => category.id !== id)
        }));
        } catch (error) {
          console.error('카테고리 삭제 실패:', error);
          
          // 오류 발생해도 UI에서는 삭제 (낙관적 업데이트)
          set((state) => ({
            categories: state.categories.filter(category => category.id !== id)
          }));
        }
      },
      
      // 카테고리 복사 함수
      copyCategory: async (categoryId, options = {}) => {
        console.log("copyCategory 함수 호출됨, categoryId:", categoryId);
        const { currentUser, categories } = get();
        
        if (!currentUser) {
          console.error("copyCategory 실패: 로그인되지 않음");
          return null;
        }
        
        console.log("카테고리 복사 중, 현재 사용자:", currentUser);
        
        const originalCategory = categories.find(c => c.id === categoryId);
        console.log("복사할 원본 카테고리:", originalCategory);
        
        if (!originalCategory) {
          console.error("copyCategory 실패: 원본 카테고리를 찾을 수 없음");
          return null;
        }
        
        // 새 카테고리 생성
        const title = options.withNewTitle 
          ? `${originalCategory.title} (복사본)` 
          : originalCategory.title;
          
        try {
          // 1. 태그 정보를 태그 이름 배열로 변환
          const tagNames = originalCategory.tagList?.map(tag => tag.name) || [];
          
          // 2. 백엔드 API 호출
          const response = await categoryService.createCategory({
            title,
            isPublic: false, // 복사본은 기본적으로 비공개
            tagNames: tagNames // tags -> tagNames로 필드명 변경
          });
          
          // 3. 응답 데이터로 새 카테고리 ID 가져오기
          const newCategoryId = response.id;
          
          // 태그 데이터 처리 (tags 또는 tagNames 필드 모두 처리)
          const tagData = response.tags || response.tagNames || [];
          
          // 4. 응답 데이터로 Category 객체 생성
          const tagList = tagData.map(tag => ({
            id: tag.id,
            name: tag.name,
            userId: currentUser.id
          }));
        
        const categoryCopy: Category = {
            id: newCategoryId,
            title: response.title,
            isPublic: response.isPublic,
            tagList: tagList,
            createdAt: response.createdAt,
            updatedAt: response.updatedAt,
            userId: currentUser.id
          };
          
          console.log("생성된 카테고리:", categoryCopy);
          
          // 5. 상태 업데이트
          set((state) => {
            const updatedCategories = [...state.categories, categoryCopy];
            console.log("업데이트된 카테고리 목록 (개수):", updatedCategories.length);
            return { categories: updatedCategories };
          });
          
          return newCategoryId;
        } catch (error) {
          console.error("백엔드 카테고리 복사 생성 실패:", error);
          
          // 오류 발생 시 로컬에만 저장 (오프라인 지원)
          const newCategoryId = uuidv4();
          
          const categoryCopy: Category = {
            id: newCategoryId,
          title,
            isPublic: false,
          tagList: originalCategory.tagList || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
            userId: currentUser.id
        };
        
        // 상태 업데이트
        set((state) => {
          const updatedCategories = [...state.categories, categoryCopy];
            console.log("업데이트된 카테고리 목록 (로컬 전용):", updatedCategories.length);
          return { categories: updatedCategories };
        });
        
        return newCategoryId;
        }
      },
      
      addTag: async (name) => {
        const currentUser = get().currentUser;
        const userId = currentUser?.id || 'anonymous';
        
        console.log('태그 생성 시도:', name);
        
        try {
          // 1. 백엔드 API 호출
          const response = await tagService.createTag({ name });
          
          console.log('태그 생성 응답:', response);
          
          // 2. 응답 데이터로 Tag 객체 생성
        const newTag = { 
            id: response.id || uuidv4(), 
            name: response.name || name,
            userId 
          };
          
          console.log('생성된 태그 객체:', newTag);
          
          // 3. 상태 업데이트
          set((state) => {
            const updatedTags = [...state.tags, newTag];
            console.log('업데이트된 태그 목록:', updatedTags.length);
            return { tags: updatedTags };
          });
          
          return newTag;
        } catch (error) {
          console.error('태그 생성 실패:', error);
          
          // 오류 발생 시 로컬에만 저장 (오프라인 지원)
          const fallbackTag = {
          id: uuidv4(), 
          name,
          userId 
        };
          
          console.log('생성된 로컬 태그 객체:', fallbackTag);
        
        set((state) => ({
            tags: [...state.tags, fallbackTag]
        }));
        
          return fallbackTag;
        }
      },
      
      findOrCreateTag: async (name) => {
        const state = get();
        const currentUser = state.currentUser;
        
        if (!currentUser) {
          console.error('태그를 추가하려면 로그인이 필요합니다.');
          return { id: 'temp', name, userId: 'anonymous' };
        }
        
        // 사용자의 기존 태그 중에서 찾기
        const existingTag = state.tags.find(tag => 
          tag.name.toLowerCase() === name.toLowerCase() && 
          tag.userId === currentUser.id
        );
        
        if (existingTag) {
          return existingTag;
        }
        
        // 새 태그 생성
        return await state.addTag(name);
      },
      
      deleteTag: async (id) => {
        try {
          // 1. 백엔드 API 호출
          await tagService.deleteTag(id);
          
          // 2. 상태 업데이트
          set((state) => ({
        tags: state.tags.filter(tag => tag.id !== id),
        bookmarks: state.bookmarks.map(bookmark => ({
          ...bookmark,
          tagList: bookmark.tagList.filter(tag => tag.id !== id)
        })),
        categories: state.categories.map(category => ({
          ...category,
          tagList: category.tagList.filter(tag => tag.id !== id)
        }))
          }));
        } catch (error) {
          console.error('태그 삭제 실패:', error);
          
          // 오류가 발생해도 UI에서는 삭제 (낙관적 업데이트)
          set((state) => ({
            tags: state.tags.filter(tag => tag.id !== id),
            bookmarks: state.bookmarks.map(bookmark => ({
              ...bookmark,
              tagList: bookmark.tagList.filter(tag => tag.id !== id)
            })),
            categories: state.categories.map(category => ({
              ...category,
              tagList: category.tagList.filter(tag => tag.id !== id)
            }))
          }));
        }
      },
      
      createShareLink: ({ bookmarkId, categoryId }) => {
        console.log("공유 링크 생성 요청:", { bookmarkId, categoryId });
        const state = get();
        
        // ID 유효성 검사
        if (bookmarkId) {
          const bookmarkExists = state.bookmarks.some(b => b.id === bookmarkId);
          if (!bookmarkExists) {
            console.error("존재하지 않는 북마크 ID:", bookmarkId);
            throw new Error("존재하지 않는 북마크입니다.");
          }
        }
        
        if (categoryId) {
          const category = state.categories.find(c => c.id === categoryId);
          if (!category) {
            console.error("존재하지 않는 카테고리 ID:", categoryId);
            throw new Error("존재하지 않는 카테고리입니다.");
          }
          
          // 카테고리에 태그가 없는 경우 경고
          if (category.tagList.length === 0) {
            console.warn("태그가 없는 카테고리:", category);
          }
        }
        
        const newShareLink = {
          id: uuidv4(),
          uuid: uuidv4(),
          bookmarkId: bookmarkId || null,
          categoryId: categoryId || null,
          createdAt: new Date().toISOString()
        };
        
        console.log("생성된 공유 링크:", newShareLink);
        
        // 기존 공유 링크 확인
        console.log("기존 공유 링크 목록:", get().sharedLinks);
        
        // 공유 링크 추가
        set((state) => {
          const newLinks = [...state.sharedLinks, newShareLink];
          console.log("업데이트된 공유 링크 목록:", newLinks);
          return { sharedLinks: newLinks };
        });
        
        return newShareLink;
      },
      
      getShareLinkByUuid: (uuid) => {
        console.log("getShareLinkByUuid 호출됨, uuid:", uuid);
        console.log("현재 sharedLinks:", get().sharedLinks);
        
        if (!uuid || !get().sharedLinks) {
          console.log("UUID가 없거나 sharedLinks가 없음");
          return null;
        }
        
        const link = get().sharedLinks.find(link => link.uuid === uuid);
        console.log("찾은 링크:", link);
        
        if (!link) {
          console.log("링크를 찾을 수 없음");
          return null;
        }
        
        // 북마크 공유인 경우
        if (link.bookmarkId) {
          const bookmark = get().bookmarks.find(b => b.id === link.bookmarkId);
          console.log("찾은 공유 북마크:", bookmark);
          return { link, bookmarkData: bookmark };
        }
        
        // 카테고리 공유인 경우
        if (link.categoryId) {
          const category = get().categories.find(c => c.id === link.categoryId);
          console.log("찾은 공유 카테고리:", category);
          
          if (category) {
            const categoryBookmarks = get().getCategoryBookmarks(category.id);
            console.log("카테고리 관련 북마크 수:", categoryBookmarks.length);
          }
          
          return { link, categoryData: category };
        }
        
        return { link };
      },
      
      // 카테고리에 북마크를 추가하는 함수 (가져오기 기능)
      importCategoryWithBookmarks: async (categoryId: string) => {
        console.log("카테고리 가져오기 함수 호출됨, categoryId:", categoryId);
        const state = get();
        console.log("현재 사용자:", state.currentUser);
        
        const category = state.categories.find(c => c.id === categoryId);
        console.log("찾은 카테고리:", category);
        
        if (!category) {
          console.error("카테고리를 찾을 수 없음:", categoryId);
          console.log("현재 카테고리 목록:", state.categories.map(c => ({ id: c.id, title: c.title })));
          return null;
        }
        
        // 새 카테고리 생성 - withNewTitle: false로 설정하여 (복사본) 접미사 제거
        console.log("카테고리 복사 시도:", category.title);
        const newCategoryId = await state.copyCategory(categoryId, { withNewTitle: false });
        console.log("복사된 카테고리 ID:", newCategoryId);
        
        if (!newCategoryId) {
          console.error("카테고리 복사 실패");
          return null;
        }
        
        // 새 카테고리 ID로 카테고리 객체 가져오기
        const newCategory = state.categories.find(c => c.id === newCategoryId);
        
        if (!newCategory) {
          console.error("복사된 카테고리를 찾을 수 없음");
          return null;
        }
        
        console.log("생성된 새 카테고리 객체:", newCategory);
        
        // 카테고리 태그와 일치하는 북마크 찾기
        if (category.tagList && category.tagList.length > 0) {
          console.log("카테고리 태그:", category.tagList);
          
          const matchedBookmarks = state.bookmarks.filter(bookmark => 
            bookmark.tagList.some(bookmarkTag => 
              category.tagList.some(categoryTag => categoryTag.id === bookmarkTag.id)
            )
          );
          
          console.log('매치된 북마크:', matchedBookmarks.length, matchedBookmarks);
          
          // 북마크 복사하여 추가 (비동기 처리)
          const copyPromises = matchedBookmarks.map(async bookmark => {
            console.log("북마크 복사 시도:", bookmark.title);
            try {
              // 비동기 함수이므로 await 처리
              const newBookmark = await state.copyBookmark(bookmark.id);
            
            if (newBookmark) {
              console.log("복사된 북마크:", newBookmark.title);
              // 복사된 북마크를 새 카테고리에 연결
                await state.updateBookmark(newBookmark.id, {
                categoryId: newCategory.id
              });
            } else {
              console.error("북마크 복사 실패:", bookmark.id);
              }
            } catch (error) {
              console.error("북마크 복사 중 오류:", error);
            }
          });
          
          // 모든 북마크 복사 완료 대기
          await Promise.all(copyPromises);
        } else {
          console.log("카테고리에 태그가 없음, 북마크 매칭 건너뜀");
        }
        
        console.log("카테고리 가져오기 완료, 반환값:", newCategory);
        return newCategory;
      },
      
      addRecentView: (bookmarkId) => set((state) => {
        const existingViewIndex = state.recentViews.findIndex(rv => rv.bookmarkId === bookmarkId);
        
        let newRecentViews;
        if (existingViewIndex >= 0) {
          // 이미 있는 경우 제거 후 맨 앞에 추가
          newRecentViews = [
            { 
              id: state.recentViews[existingViewIndex].id, 
              bookmarkId, 
              viewedAt: new Date().toISOString() 
            },
            ...state.recentViews.filter(rv => rv.bookmarkId !== bookmarkId)
          ];
        } else {
          // 없는 경우 새로 추가
          newRecentViews = [
            { id: uuidv4(), bookmarkId, viewedAt: new Date().toISOString() },
            ...state.recentViews
          ];
        }
        
        return { recentViews: newRecentViews.slice(0, 10) }; // 최대 10개까지만 유지
      }),
      
      login: async (email, password) => {
        try {
          console.log('로그인 시도:', { email });
          
          // 실제 API 호출 (authClient 사용)
          console.log('인증 API 호출 시도...');
          const response = await apiClient.post('/auth/login', {
            email,
            password
          });
          console.log('인증 API 응답 받음:', response.data);
          
          // 토큰 저장
          const { accessToken, refreshToken, user } = response.data;
          safeLocalStorage.setItem('accessToken', accessToken);
          safeLocalStorage.setItem('refreshToken', refreshToken);
          
          // 사용자 입력 이메일 저장 (로그인 시 입력한 이메일 사용)
          safeLocalStorage.setItem('userEmail', email);
          
          // 백엔드에서 받은 사용자 정보 사용
          if (user) {
            // 기존 user 객체에 이메일 정보 추가
            const userWithEmail = {
              ...user,
              email: email  // 입력된 이메일 사용
            };
            set({ currentUser: userWithEmail });
            console.log('로그인 성공 (이메일 추가):', userWithEmail);
            return userWithEmail;
          } else {
            // 토큰에서 ID만 추출하고 사용자 객체 직접 생성
            const userId = getIdFromToken(accessToken);
            const username = email.split('@')[0]; // 이메일의 @ 앞부분만 사용자 이름으로 사용
            
            const userInfo = {
              id: userId || ('user-' + Date.now()),
              username: username,
              email: email
            };
            
            set({ currentUser: userInfo });
            console.log('로그인 성공 (사용자 생성):', userInfo);
            return userInfo;
          }
        } catch (error) {
          console.error('로그인 오류:', error);
          throw error;
        }
      },
      
      register: async (email, password, username) => {
        try {
          console.log('회원가입 시도:', { email, username });
          
          // 회원가입 API 호출
          const registerResponse = await apiClient.post('/users/register', {
            email,
            password,
            name: username
          });
          
          console.log('회원가입 완료. 자동 로그인 시도:', email);
          
          // 이메일 정보 저장 (회원가입 시 입력한 이메일 사용)
          safeLocalStorage.setItem('userEmail', email);
          
          // 회원가입 성공 후 자동 로그인 시도
          try {
            const loginResponse = await apiClient.post('/auth/login', {
              email,
              password
            });
            
            // 로그인 성공 시 토큰 저장
            const { accessToken, refreshToken, user } = loginResponse.data;
            safeLocalStorage.setItem('accessToken', accessToken);
            safeLocalStorage.setItem('refreshToken', refreshToken);
            
            // 백엔드에서 받은 사용자 정보 사용
            if (user) {
              // 기존 user 객체에 이메일 정보 추가
              const userWithEmail = {
                ...user,
                email: email  // 입력된 이메일 사용
              };
              set({ currentUser: userWithEmail });
              console.log('자동 로그인 성공 (이메일 추가):', userWithEmail);
            } else {
              // 토큰에서 사용자 정보 추출하는 대신 직접 사용자 객체 생성
              const userId = getIdFromToken(accessToken);
              const defaultUsername = username || email.split('@')[0];
              const userInfo = {
                id: userId || ('user-' + Date.now()),
                username: defaultUsername,
                email: email
              };
              
              set({ currentUser: userInfo });
              console.log('자동 로그인 성공 (사용자 생성):', userInfo);
            }
          } catch (loginError) {
            console.error('자동 로그인 실패:', loginError);
            // 자동 로그인 실패해도 회원가입은 성공했으므로 원래 결과 반환
          }
          
          return registerResponse.data;
        } catch (error) {
          console.error('회원가입 오류:', error);
          throw error;
        }
      },
      
      logout: async () => {
        try {
          // 실제 API 호출은 필요 없고 토큰만 제거
          safeLocalStorage.removeItem('accessToken');
          safeLocalStorage.removeItem('refreshToken');
          safeLocalStorage.removeItem('userEmail');
          set({ currentUser: null });
        } catch (error) {
          console.error('로그아웃 오류:', error);
          // 오류 발생해도 토큰 및 상태 정리
          safeLocalStorage.removeItem('accessToken');
          safeLocalStorage.removeItem('refreshToken');
          safeLocalStorage.removeItem('userEmail');
          set({ currentUser: null });
        }
      },

      verifyEmail: async (email, code) => {
        try {
          console.log('이메일 인증 시도:', { email, code });
          
          // 실제 API 호출
          const response = await apiClient.post(`/email/verify-code?email=${email}&code=${code}`);
          
          console.log('이메일 인증 결과:', response.data);
          return response.data;
        } catch (error) {
          console.error('이메일 인증 오류:', error);
          throw error;
        }
      },

      resendVerification: async (email) => {
        try {
          console.log('인증 코드 재발송 시도:', { email });
          
          // 실제 API 호출
          const response = await apiClient.post(`/email/send-code?email=${email}`);
          
          console.log('인증 코드 재발송 결과:', response.data);
          return response.data;
        } catch (error) {
          console.error('인증 코드 재발송 오류:', error);
          throw error;
        }
      },

      // 비밀번호 찾기 이메일 발송
      forgotPassword: async (email) => {
        try {
          console.log('비밀번호 찾기 요청:', { email });
          
          // 실제 API 구현 시 수정 필요
          const response = await apiClient.post('/forgot-password', { email });
          
          console.log('비밀번호 재설정 이메일 발송 결과:', response.data);
          return response.data;
        } catch (error) {
          console.error('비밀번호 찾기 오류:', error);
          throw error;
        }
      },

      // 비밀번호 재설정
      resetPassword: async (token, newPassword) => {
        try {
          console.log('비밀번호 재설정 요청:', { token: token.slice(0, 10) + '...' });
          
          // 실제 API 구현 시 수정 필요
          const response = await apiClient.post('/reset-password', { 
            token, 
            newPassword 
          });
          
          console.log('비밀번호 재설정 결과:', response.data);
          return response.data;
        } catch (error) {
          console.error('비밀번호 재설정 오류:', error);
          throw error;
        }
      },

      // 계정 탈퇴 함수
      deleteAccount: async (password) => {
        try {
          const { currentUser } = get();
          
          if (!currentUser) {
            throw new Error('로그인 상태가 아닙니다.');
          }
          
          console.log('계정 탈퇴 시도:', { userId: currentUser.id });
          
          // 실제 API 호출
          const response = await apiClient.post('/users/delete-account', { password });
          
          // 토큰 삭제
          safeLocalStorage.removeItem('accessToken');
          safeLocalStorage.removeItem('refreshToken');
          
          // 상태 초기화
          set({ currentUser: null });
          
          console.log('계정이 성공적으로 삭제되었습니다.');
          return response.data;
        } catch (error) {
          console.error('계정 탈퇴 오류:', error);
          throw error;
        }
      }
    }),
    {
      name: 'bookmark-storage', // localStorage 키 이름
      onRehydrateStorage: () => (state) => {
        // 하이드레이션 완료 후 상태 업데이트
        if (state) {
          state.hydrated = true;
          
          // 하이드레이션 후 백엔드에서 데이터 로드
          const loadData = async () => {
            if (state.currentUser) {
              try {
                // 1. 백엔드에서 북마크 데이터 로드
                await state.loadUserBookmarks();
                console.log('백엔드에서 북마크 데이터 로드 완료');
                
                // 2. 백엔드에서 카테고리 데이터 로드
                await state.loadUserCategories();
                console.log('백엔드에서 카테고리 데이터 로드 완료');
                
                // 3. 추가적인 데이터 로드 로직 (나중에 확장 가능)
                
              } catch (error) {
                console.error('데이터 로드 실패:', error);
              }
            } else {
              console.log('로그인되지 않음: 데이터 로드 건너뜀');
              
              // 로컬 스토리지에 토큰이 있는지 확인
              const token = safeLocalStorage.getItem('accessToken');
              const email = safeLocalStorage.getItem('userEmail');
              
              if (token && email) {
                console.log('저장된, 토큰 발견, 자동 로그인 시도');
                try {
                  // 토큰에서 사용자 정보 추출
                  const user = extractUserFromToken(token, email);
                  if (user) {
                    // 사용자 상태 업데이트
                    state.currentUser = user;
                    console.log('토큰을 사용하여 자동으로 로그인됨:', user);
                    
                    // 데이터 로드 재시도
                    await state.loadUserBookmarks();
                    console.log('자동 로그인 후 북마크 데이터 로드 완료');
                    
                    // 카테고리 데이터도 로드
                    await state.loadUserCategories();
                    console.log('자동 로그인 후 카테고리 데이터 로드 완료');
                  }
                } catch (autoLoginError) {
                  console.error('자동 로그인 실패:', autoLoginError);
                }
              }
            }
          };
          
          loadData();
        }
      }
    }
  )
);

// 하이드레이션 상태 확인 훅
export const useHydration = () => {
  const hydrated = useBookmarkStore(state => state.hydrated);
  const [isHydrated, setIsHydrated] = React.useState(hydrated);
  
  React.useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      setIsHydrated(hydrated);
    }
  }, [hydrated]);
  
  return isHydrated;
}; 