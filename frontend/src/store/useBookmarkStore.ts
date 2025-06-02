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
    
    // 닉네임 필드를 직접 사용 (MongoDB에 저장된 nickname 필드 참조)
    // 백엔드에서 토큰에 nickname 정보를 포함시켜야 함
    const nickname = decoded.nickname || decoded.username;
    
    return {
      id: decoded.sub || ('user-' + Date.now()),
      username: nickname || email, // 닉네임이 없는 경우에만 이메일을 대체값으로 사용
      email: email
    };
  } catch (e) {
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
  createShareLink: (params: { bookmarkId?: string; categoryId?: string }) => Promise<SharedLink>;
  getShareLinkByUuid: (uuid: string) => Promise<any>;
  
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

  // 백엔드에서 태그 데이터 로드
  loadUserTags: () => Promise<Tag[]>;
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
          if (!currentUser) {
            return [];
          }
          const response = await bookmarkService.getAllBookmarks();
          // 응답이 없거나 배열이 아닌 경우 빈 배열 반환
          if (!response || !Array.isArray(response)) {
            return [];
          }
          
          // 백엔드에서 받은 데이터를 프론트엔드 형식으로 변환
          const bookmarks: Bookmark[] = response.map(item => {
            // 태그 데이터 처리 (tags 또는 tagNames 필드 모두 처리)
            const tagData = item.tags || item.tagNames || [];
            return {
              id: item.id,
              title: item.title,
              url: item.url,
              description: item.description || '',
              categoryId: item.categoryId || '',
              tagList: convertTagData(tagData, currentUser.id),
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              isFavorite: item.favorite || false, // 백엔드 favorite 필드를 isFavorite로 매핑
              userId: currentUser.id,
              integrated: false
            };
          });
          
          set({ bookmarks });
          return bookmarks;
        } catch (error) {
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
            return [];
          }
          
          // 백엔드에서 받은 데이터를 프론트엔드 형식으로 변환
          const categories: Category[] = response.map(item => {
            // 태그 데이터 처리 (tags 또는 tagNames 필드 모두 처리)
            const tagData = item.tags || item.tagNames || [];
            const currentTags = get().tags; // 현재 tags 배열 가져오기
            
            // 태그 데이터 변환 (문자열 또는 객체 형식 모두 처리)
            const tagList = tagData.map((tagItem: any) => {
              // 문자열인 경우 (태그 이름만 있는 경우)
              if (typeof tagItem === 'string') {
                // 기존 태그에서 같은 이름의 태그 찾기
                const existingTag = currentTags.find(tag => 
                  tag.name === tagItem && tag.userId === currentUser.id
                );
                
                if (existingTag) {
                  return existingTag; // 기존 태그 사용
                }
                
                return {
                  id: `tag-${tagItem.toLowerCase().replace(/\s+/g, '-')}-${currentUser.id}`, // 일관된 ID 생성
                  name: tagItem,
                  userId: currentUser.id
                };
              }
              // 객체인 경우 (id와 name이 있는 경우)
              if (tagItem.id) {
                // ID가 있는 경우 그대로 사용
                return {
                  id: tagItem.id,
                  name: tagItem.name || '무제 태그',
                  userId: currentUser.id
                };
              }
              
              // ID가 없는 객체인 경우 기존 태그 찾기
              const existingTag = currentTags.find(tag => 
                tag.name === tagItem.name && tag.userId === currentUser.id
              );
              
              if (existingTag) {
                return existingTag;
              }
              
              return {
                id: `tag-${tagItem.name.toLowerCase().replace(/\s+/g, '-')}-${currentUser.id}`,
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
          return [];
        }
      },
      
      // 백엔드에서 태그 데이터 로드
      loadUserTags: async (): Promise<Tag[]> => {
        try {
          const currentUser = get().currentUser;
          if (!currentUser) return [];
          
          const response = await tagService.getAllTags();
          
          // 응답이 없거나 배열이 아닌 경우 빈 배열 반환
          if (!response || !Array.isArray(response)) {
            return [];
          }
          
          // 백엔드에서 받은 데이터를 프론트엔드 형식으로 변환
          const tags: Tag[] = response.map(item => ({
            id: item.id,
            name: item.name,
            userId: currentUser.id
          }));
          
          set({ tags });
          return tags;
        } catch (error) {
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
      getCategoryBookmarks: (categoryId: string): Bookmark[] => {
        const { bookmarks, categories } = get();
        
        // 카테고리 찾기
        const category = categories.find(c => c.id === categoryId);
        if (!category) {
          return [];
        }
        
        // 1. 먼저 직접 카테고리 ID로 연결된 북마크 찾기
        const directBookmarks = bookmarks.filter(bookmark => 
          bookmark.categoryId === categoryId
        );
        
        // 2. 카테고리 태그와 일치하는 북마크 찾기
        let tagMatchedBookmarks: Bookmark[] = [];
        
        // 태그 기반 매칭은 카테고리에 태그가 있는 경우에만 수행
        if (category.tagList && category.tagList.length > 0) {
          // 카테고리 태그 ID 집합 생성
          const categoryTagIds = new Set(category.tagList.map(tag => tag.id));
          
          // 태그 ID가 일치하는 북마크 필터링
          tagMatchedBookmarks = bookmarks.filter(bookmark => {
            // 이미 직접 연결된 북마크는 제외
            if (bookmark.categoryId === categoryId) return false;
            
            // 북마크에 태그가 없는 경우 매칭되지 않음
            if (!bookmark.tagList || bookmark.tagList.length === 0) return false;
            
            // 북마크의 태그 ID 중 하나라도 카테고리 태그 ID와 일치하는지 확인
            return bookmark.tagList.some(tag => categoryTagIds.has(tag.id));
          });
        }
        
        // 3. 두 결과 합치기
        return [...directBookmarks, ...tagMatchedBookmarks];
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
          // 2. 백엔드 API 호출
          return bookmarkService.createBookmark({
            title: bookmarkData.title,
            url: bookmarkData.url,
            description: bookmarkData.description,
            categoryId: bookmarkData.categoryId || null, // null로 명시적 처리
            tagNames: tagNames // tags -> tagNames로 필드명 변경
          }).then(response => {
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
              isFavorite: response.favorite,
          userId: userId,
              integrated: bookmarkData.integrated || false
        };
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
          throw error;
        }
      },
      
      updateBookmark: async (id, bookmarkData) => {
        const { currentUser, bookmarks } = get();
        
        // 북마크 소유자 검증
        const bookmark = bookmarks.find(b => b.id === id);
        if (!bookmark || (currentUser && bookmark.userId !== currentUser.id)) {
          return;
        }
        
        try {
          // 1. 태그 리스트를 태그 이름 배열로 변환
          const tagNames = bookmarkData.tagList?.map(tag => tag.name);
          // 2. 백엔드 API 호출
          const updateData: any = {};
          if (bookmarkData.title) updateData.title = bookmarkData.title;
          if (bookmarkData.url) updateData.url = bookmarkData.url;
          if (bookmarkData.description !== undefined) updateData.description = bookmarkData.description;
          if (bookmarkData.categoryId !== undefined) updateData.categoryId = bookmarkData.categoryId;
          if (tagNames) updateData.tagNames = tagNames; // tags -> tagNames로 필드명 변경
          const response = await bookmarkService.updateBookmark(id, updateData);
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
          throw error;
        }
      },
      
      deleteBookmark: async (id) => {
        const { currentUser, bookmarks } = get();
        
        // 북마크 소유자 검증
        const bookmark = bookmarks.find(b => b.id === id);
        if (!bookmark || (currentUser && bookmark.userId !== currentUser.id)) {
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
          throw error;
        }
      },
      
      toggleFavorite: async (id) => {
        const { currentUser, bookmarks } = get();
        
        // 북마크 소유자 검증
        const bookmark = bookmarks.find(b => b.id === id);
        if (!bookmark || (currentUser && bookmark.userId !== currentUser.id)) {
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
        const currentUser = get().currentUser;
        
        if (!currentUser) {
          return null;
        }
        
        try {
          // 1. 태그 정보를 태그 이름 배열로 변환
          const tagNames = categoryData.tagList?.map(tag => tag.name) || [];
          // 2. 백엔드 API 호출
          const response = await categoryService.createCategory({
            title: categoryData.title,
            isPublic: categoryData.isPublic || false,
            tagNames: tagNames // tags -> tagNames로 필드명 변경
          });
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
          // 4. 상태 업데이트
        set((state) => {
          const updatedCategories = [...state.categories, newCategory];
          return { categories: updatedCategories };
        });
        
          return newCategory.id;
        } catch (error) {
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
          return;
        }
        
        try {
          // 1. 태그 정보를 태그 이름 배열로 변환 (태그 필드가 있는 경우)
          const updateData: any = { ...categoryData };
          if (categoryData.tagList) {
            updateData.tagNames = categoryData.tagList.map(tag => tag.name); // tags -> tagNames로 필드명 변경
            delete updateData.tagList; // API 호출 시 tagList 필드 제거
          }
          
          // 2. 백엔드 API 호출
          const response = await categoryService.updateCategory(id, updateData);
          // 태그 데이터 처리 (tags 또는 tagNames 필드 모두 처리)
          let tagData: any[] = [];
          
          // 응답에서 태그 데이터 추출
          if (Array.isArray(response.tags)) {
            tagData = response.tags;
          } else if (Array.isArray(response.tagNames)) {
            tagData = response.tagNames;
          } else {
            // 원본 tagList에서 태그 데이터 사용
            if (categoryData.tagList) {
              tagData = categoryData.tagList;
            }
          }
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
        } catch (error) {
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
          // 오류 발생해도 UI에서는 삭제 (낙관적 업데이트)
          set((state) => ({
            categories: state.categories.filter(category => category.id !== id)
          }));
        }
      },
      
      // 카테고리 복사 함수
      copyCategory: async (categoryId, options = {}) => {
        const { currentUser, categories } = get();
        
        if (!currentUser) {
          return null;
        }
        const originalCategory = categories.find(c => c.id === categoryId);
        if (!originalCategory) {
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
          const tagList = tagData.map((tag: ApiTag | string) => {
            if (typeof tag === 'string') {
              return {
                id: `tag-${Math.random()}`,
                name: tag,
                userId: currentUser.id
              };
            }
            return {
              id: tag.id,
              name: tag.name,
              userId: currentUser.id
            };
          });
        
        const categoryCopy: Category = {
            id: newCategoryId,
            title: response.title,
            isPublic: response.isPublic,
            tagList: tagList,
            createdAt: response.createdAt,
            updatedAt: response.updatedAt,
            userId: currentUser.id
          };
          // 5. 상태 업데이트
          set((state) => {
            const updatedCategories = [...state.categories, categoryCopy];
            return { categories: updatedCategories };
          });
          
          return newCategoryId;
        } catch (error) {
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
          return { categories: updatedCategories };
        });
        
        return newCategoryId;
        }
      },
      
      addTag: async (name) => {
        const currentUser = get().currentUser;
        const userId = currentUser?.id || 'anonymous';
        try {
          // 1. 백엔드 API 호출
          const response = await tagService.createTag({ name });
          // 2. 응답 데이터로 Tag 객체 생성
        const newTag = { 
            id: response.id || uuidv4(), 
            name: response.name || name,
            userId 
          };
          // 3. 상태 업데이트
          set((state) => {
            const updatedTags = [...state.tags, newTag];
            return { tags: updatedTags };
          });
          
          return newTag;
        } catch (error) {
          // 오류 발생 시 로컬에만 저장 (오프라인 지원)
          const fallbackTag = {
          id: uuidv4(), 
          name,
          userId 
        };
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
      
      createShareLink: async ({ bookmarkId, categoryId }) => {
        const state = get();
        
        // ID 유효성 검사
        if (bookmarkId) {
          const bookmarkExists = state.bookmarks.some(b => b.id === bookmarkId);
          if (!bookmarkExists) {
            throw new Error("존재하지 않는 북마크입니다.");
          }
        }
        
        if (categoryId) {
          const category = state.categories.find(c => c.id === categoryId);
          if (!category) {
            throw new Error("존재하지 않는 카테고리입니다.");
          }
          
          // 카테고리에 태그가 없는 경우 경고
          if (category.tagList.length === 0) {
            console.warn("태그가 없는 카테고리:", category);
          }
          
          try {
            // 백엔드 API를 호출하여 실제 공유 토큰 생성
            const shareToken = await categoryService.generateShareToken(categoryId);
            
            const newShareLink = {
              id: uuidv4(),
              uuid: shareToken, // 백엔드에서 받은 토큰 사용
              bookmarkId: null,
              categoryId: categoryId,
              createdAt: new Date().toISOString()
            };
            
            // 공유 링크 추가
            set((state) => {
              const newLinks = [...state.sharedLinks, newShareLink];
              return { sharedLinks: newLinks };
            });
            
            return newShareLink;
          } catch (error) {
            throw new Error("공유 링크 생성에 실패했습니다.");
          }
        }
        
        // 북마크 공유는 아직 백엔드 API가 없으므로 기존 로직 유지
        if (bookmarkId) {
          const newShareLink = {
            id: uuidv4(),
            uuid: uuidv4(),
            bookmarkId: bookmarkId,
            categoryId: null,
            createdAt: new Date().toISOString()
          };
          
          set((state) => {
            const newLinks = [...state.sharedLinks, newShareLink];
            return { sharedLinks: newLinks };
          });
          
          return newShareLink;
        }
        
        throw new Error("북마크 ID 또는 카테고리 ID가 필요합니다.");
      },
      
      getShareLinkByUuid: async (uuid) => {
        if (!uuid) {
          return null;
        }
        
        // 1. 백엔드에서 공유된 카테고리 조회 시도 (우선순위)
        try {
          const sharedCategoryData = await categoryService.getSharedCategory(uuid);
          
          if (sharedCategoryData) {
            // 백엔드 응답을 프론트엔드 형식으로 변환
            const tagList = (sharedCategoryData.tagNames || []).map((tagName: string) => ({
              id: `tag-${tagName}-${Math.random()}`,
              name: tagName,
              userId: 'shared' // 공유된 카테고리의 태그
            }));
            
            const category = {
              id: sharedCategoryData.id,
              title: sharedCategoryData.title,
              tagList: tagList,
              createdAt: new Date().toISOString(), // 임시값
              updatedAt: new Date().toISOString(), // 임시값
              userId: 'shared', // 공유된 카테고리
              isPublic: true // 공유 링크로 접근 가능하므로 공개로 처리
            };
            
            // 가상의 공유 링크 객체 생성
            const shareLink = {
              id: uuid,
              uuid: uuid,
              bookmarkId: null,
              categoryId: sharedCategoryData.id,
              createdAt: new Date().toISOString()
            };
            
            return { 
              link: shareLink, 
              categoryData: category,
              bookmarks: sharedCategoryData.bookmarks || [] // 백엔드에서 받은 북마크 데이터
            };
          }
        } catch (error) {
          console.error('백엔드 공유 카테고리 조회 실패:', error);
        }
        
        // 2. 로컬 공유 링크에서 찾기 (북마크 공유용 또는 로컬 카테고리)
        const localLinks = get().sharedLinks;
        const localLink = localLinks.find(link => link.uuid === uuid);
        
        if (localLink) {
          // 북마크 공유인 경우
          if (localLink.bookmarkId) {
            const bookmark = get().bookmarks.find(b => b.id === localLink.bookmarkId);
            return { link: localLink, bookmarkData: bookmark };
          }
          
          // 로컬 카테고리 공유인 경우
          if (localLink.categoryId) {
            const category = get().categories.find(c => c.id === localLink.categoryId);
            return { link: localLink, categoryData: category };
          }
        }
        
        return null;
      },
      
      // 카테고리에 북마크를 추가하는 함수 (가져오기 기능)
      importCategoryWithBookmarks: async (categoryId: string) => {
        const state = get();
        const category = state.categories.find(c => c.id === categoryId);
        if (!category) {
          return null;
        }
        
        // 새 카테고리 생성 - withNewTitle: false로 설정하여 (복사본) 접미사 제거
        const newCategoryId = await state.copyCategory(categoryId, { withNewTitle: false });
        if (!newCategoryId) {
          return null;
        }
        
        // 새 카테고리 ID로 카테고리 객체 가져오기
        const newCategory = state.categories.find(c => c.id === newCategoryId);
        
        if (!newCategory) {
          return null;
        }
        // 카테고리 태그와 일치하는 북마크 찾기
        if (category.tagList && category.tagList.length > 0) {
          // 카테고리 태그 ID 집합 생성
          const categoryTagIds = new Set(category.tagList.map(tag => tag.id));
          
          // 북마크 태그 중 하나라도 카테고리 태그 ID와 일치하는 북마크 필터링
          const matchedBookmarks = state.bookmarks.filter(bookmark => 
            bookmark.tagList && bookmark.tagList.some(tag => categoryTagIds.has(tag.id))
          );
          // 북마크 복사하여 추가 (비동기 처리)
          const copyPromises = matchedBookmarks.map(async bookmark => {
            try {
              // 비동기 함수이므로 await 처리
              const newBookmark = await state.copyBookmark(bookmark.id);
            
            if (newBookmark) {
              // 복사된 북마크를 새 카테고리에 연결
                await state.updateBookmark(newBookmark.id, {
                categoryId: newCategory.id
              });
            } else {
              }
            } catch (error) {
            }
          });
          
          // 모든 북마크 복사 완료 대기
          await Promise.all(copyPromises);
        } else {
        }
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
          // 실제 API 호출 (authClient 사용)
          const response = await apiClient.post('/auth/login', {
            email,
            password
          });
          
          // 토큰 저장
          const { accessToken, refreshToken, user } = response.data;
          safeLocalStorage.setItem('accessToken', accessToken);
          safeLocalStorage.setItem('refreshToken', refreshToken);
          
          // 사용자 입력 이메일 저장 (로그인 시 입력한 이메일 사용)
          safeLocalStorage.setItem('userEmail', email);
          
          // 백엔드에서 받은 사용자 정보 사용
          if (user) {
            // 백엔드에서 받은 user 객체에서 nickname 필드를 username으로 매핑
            const userWithEmail = {
              ...user,
              username: user.nickname,  // 백엔드의 nickname을 username으로 사용
              email: email  // 입력된 이메일 사용
            };
            set({ currentUser: userWithEmail });
            return userWithEmail;
          } else {
            // 토큰에서 사용자 정보 추출
            const decoded = jwtDecode(accessToken) as any;
            const userId = getIdFromToken(accessToken);
            
            // 닉네임 필드를 직접 사용 (MongoDB에 저장된 nickname 필드 참조)
            const nickname = decoded.nickname;
            
            const userInfo = {
              id: userId || ('user-' + Date.now()),
              username: nickname || email, // 닉네임이 없는 경우에만 이메일을 대체값으로 사용
              email: email
            };
            
            set({ currentUser: userInfo });
            return userInfo;
          }
        } catch (error) {
          throw error;
        }
      },
      
      register: async (email, password, username) => {
        try {
          // 회원가입 API 호출
          const registerResponse = await apiClient.post('/users/register', {
            email,
            password,
            nickname: username
          });
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
              // 백엔드에서 받은 user 객체에서 nickname 필드를 username으로 매핑
              const userWithEmail = {
                ...user,
                username: user.nickname, // 백엔드의 nickname을 username으로 사용
                email: email  // 입력된 이메일 사용
              };
              set({ currentUser: userWithEmail });
            } else {
              // 토큰에서 사용자 정보 추출
              const decoded = jwtDecode(accessToken) as any;
              const userId = getIdFromToken(accessToken);
              
              // 회원가입 시 설정한 닉네임 사용
              const userInfo = {
                id: userId || ('user-' + Date.now()),
                username: username, // 회원가입 시 입력한 username 값(nickname)을 그대로 사용
                email: email
              };
              
              set({ currentUser: userInfo });
            }
          } catch (loginError) {
            // 자동 로그인 실패해도 회원가입은 성공했으므로 원래 결과 반환
          }
          
          return registerResponse.data;
        } catch (error) {
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
          // 오류 발생해도 토큰 및 상태 정리
          safeLocalStorage.removeItem('accessToken');
          safeLocalStorage.removeItem('refreshToken');
          safeLocalStorage.removeItem('userEmail');
          set({ currentUser: null });
        }
      },

      verifyEmail: async (email, code) => {
        try {
          // 실제 API 호출
          const response = await apiClient.post(`/email/verify-code?email=${email}&code=${code}`);
          return response.data;
        } catch (error) {
          throw error;
        }
      },

      resendVerification: async (email) => {
        try {
          // 실제 API 호출
          const response = await apiClient.post(`/email/send-code?email=${email}`);
          return response.data;
        } catch (error) {
          throw error;
        }
      },

      // 비밀번호 찾기 이메일 발송
      forgotPassword: async (email) => {
        try {
          // 실제 API 구현 시 수정 필요
          const response = await apiClient.post('/forgot-password', { email });
          return response.data;
        } catch (error) {
          throw error;
        }
      },

      // 비밀번호 재설정
      resetPassword: async (token, newPassword) => {
        try {
          // 실제 API 구현 시 수정 필요
          const response = await apiClient.post('/reset-password', { 
            token, 
            newPassword 
          });
          return response.data;
        } catch (error) {
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
          // 실제 API 호출
          const response = await apiClient.post('/users/delete-account', { password });
          
          // 토큰 삭제
          safeLocalStorage.removeItem('accessToken');
          safeLocalStorage.removeItem('refreshToken');
          
          // 상태 초기화
          set({ currentUser: null });
          return response.data;
        } catch (error) {
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
                // 2. 백엔드에서 카테고리 데이터 로드
                await state.loadUserCategories();
                // 3. 백엔드에서 태그 데이터 로드
                await state.loadUserTags();
                // 4. 추가적인 데이터 로드 로직 (나중에 확장 가능)
                
              } catch (error) {
              }
            } else {
              // 로컬 스토리지에 토큰이 있는지 확인
              const token = safeLocalStorage.getItem('accessToken');
              const email = safeLocalStorage.getItem('userEmail');
              
              if (token && email) {
                try {
                  // 토큰에서 사용자 정보 추출
                  const user = extractUserFromToken(token, email);
                  if (user) {
                    // 사용자 상태 업데이트
                    state.currentUser = user;
                    // 데이터 로드 재시도
                    await state.loadUserBookmarks();
                    // 카테고리 데이터도 로드
                    await state.loadUserCategories();
                    // 태그 데이터도 로드
                    await state.loadUserTags();
                  }
                } catch (autoLoginError) {
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