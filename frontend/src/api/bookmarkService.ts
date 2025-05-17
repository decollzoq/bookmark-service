import apiClient from './apiClient';

interface Tag {
  id: string;
  name: string;
}

interface BookmarkRequest {
  title: string;
  url: string;
  categoryId?: string | null;
  description?: string;
  tagNames?: string[]; // 백엔드와 필드명 일치하도록 변경 (tags -> tagNames)
}

interface BookmarkUpdateRequest {
  title?: string;
  url?: string;
  categoryId?: string | null;
  description?: string;
  tagNames?: string[]; // 백엔드와 필드명 일치하도록 변경 (tags -> tagNames)
}

interface BookmarkResponse {
  id: string;
  title: string;
  url: string;
  description?: string;
  categoryId?: string | null;
  // 백엔드 응답이 일관되지 않을 수 있어서 두 가지 필드 모두 정의
  tags?: Tag[];
  tagNames?: Tag[]; // 백엔드에서 이 필드명을 사용함
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

// 북마크 관련 서비스
const bookmarkService = {
  // 모든 북마크 조회
  getAllBookmarks: async (): Promise<BookmarkResponse[]> => {
    const response = await apiClient.get<BookmarkResponse[]>('/api/bookmarks');
    console.log('북마크 응답 데이터:', response.data); // 응답 로깅 추가
    return response.data;
  },
  
  // 북마크 검색
  searchBookmarks: async (keyword: string): Promise<BookmarkResponse[]> => {
    const response = await apiClient.get<BookmarkResponse[]>(`/api/bookmarks/search?keyword=${encodeURIComponent(keyword)}`);
    return response.data;
  },
  
  // 즐겨찾기한 북마크 조회
  getFavoriteBookmarks: async (): Promise<BookmarkResponse[]> => {
    const response = await apiClient.get<BookmarkResponse[]>('/api/bookmarks/favorites');
    return response.data;
  },
  
  // 북마크 생성
  createBookmark: async (bookmarkData: BookmarkRequest): Promise<BookmarkResponse> => {
    const response = await apiClient.post<BookmarkResponse>('/api/bookmarks', bookmarkData);
    return response.data;
  },
  
  // 북마크 수정
  updateBookmark: async (id: string, bookmarkData: BookmarkUpdateRequest): Promise<BookmarkResponse> => {
    const response = await apiClient.put<BookmarkResponse>(`/api/bookmarks/${id}`, bookmarkData);
    return response.data;
  },
  
  // 북마크 즐겨찾기 토글
  toggleFavorite: async (id: string): Promise<void> => {
    await apiClient.patch(`/api/bookmarks/${id}/favorite`);
  },
  
  // 북마크 삭제
  deleteBookmark: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/bookmarks/${id}`);
  }
};

export default bookmarkService;
export type { BookmarkRequest, BookmarkUpdateRequest, BookmarkResponse, Tag }; 