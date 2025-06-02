import apiClient from './apiClient';
import type { BookmarkResponse } from './bookmarkService';
import type { Tag } from './tagService';

interface CategoryRequest {
  title: string;
  isPublic?: boolean;
  tagNames?: string[]; // 백엔드와 필드명 일치하도록 변경 (tags -> tagNames)
}

interface CategoryUpdateRequest {
  title?: string;
  isPublic?: boolean;
  tagNames?: string[]; // 백엔드와 필드명 일치하도록 변경 (tags -> tagNames)
}

interface CategoryResponse {
  id: string;
  title: string;
  isPublic: boolean;
  // 백엔드 응답이 일관되지 않을 수 있어서 두 가지 필드 모두 정의
  tags?: Tag[];
  tagNames?: string[] | Tag[]; // 백엔드에서 이 필드명을 주로 사용하며, 문자열 배열 또는 태그 객체 배열일 수 있음
  createdAt: string;
  updatedAt: string;
}

interface ShareCategoryResponse {
  id: string;
  title: string;
  tagNames: string[];
  bookmarks: BookmarkResponse[];
}

// 카테고리 관련 서비스
const categoryService = {
  // 모든 카테고리 조회
  getAllCategories: async (): Promise<CategoryResponse[]> => {
    const response = await apiClient.get<CategoryResponse[]>('/api/categories');
    console.log('카테고리 응답 데이터:', response.data); // 응답 로깅 추가
    return response.data;
  },
  
  // 카테고리 생성
  createCategory: async (categoryData: CategoryRequest): Promise<CategoryResponse> => {
    const response = await apiClient.post<CategoryResponse>('/api/categories', categoryData);
    return response.data;
  },
  
  // 카테고리 수정
  updateCategory: async (id: string, categoryData: CategoryUpdateRequest): Promise<CategoryResponse> => {
    const response = await apiClient.put<CategoryResponse>(`/api/categories/${id}`, categoryData);
    return response.data;
  },
  
  // 카테고리 삭제
  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/categories/${id}`);
  },
  
  // 카테고리 공개/비공개 토글
  toggleVisibility: async (id: string): Promise<void> => {
    await apiClient.patch(`/api/categories/${id}/visibility`);
  },
  
  // 카테고리에 포함된 북마크 조회
  getBookmarksByCategory: async (categoryId: string): Promise<BookmarkResponse[]> => {
    try {
      const response = await apiClient.get<BookmarkResponse[]>(`/api/categories/${categoryId}/bookmarks`);
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  // 카테고리 공유 링크 생성
  generateShareToken: async (categoryId: string): Promise<string> => {
    const response = await apiClient.post<string>(`/api/categories/${categoryId}/share-token`);
    return response.data;
  },
  
  // 공유된 카테고리 조회
  getSharedCategory: async (token: string): Promise<ShareCategoryResponse> => {
    const response = await apiClient.get<ShareCategoryResponse>(`/api/categories/share/${token}`);
    return response.data;
  },
  
  // 공유된 카테고리 가져오기
  importCategory: async (token: string): Promise<CategoryResponse> => {
    const response = await apiClient.post<CategoryResponse>(`/api/categories/share/${token}/import`);
    return response.data;
  },
  
  // 카테고리 공유 취소
  deleteShareToken: async (categoryId: string): Promise<void> => {
    await apiClient.delete(`/api/categories/${categoryId}/share-token`);
  }
};

export default categoryService;
export type { CategoryRequest, CategoryUpdateRequest, CategoryResponse, ShareCategoryResponse }; 