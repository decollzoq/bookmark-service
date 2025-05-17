import apiClient from './apiClient';

export interface Tag {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TagRequest {
  name: string;
}

interface TagUpdateRequest {
  name: string;
}

// 태그 관련 서비스
const tagService = {
  // 모든 태그 조회
  getAllTags: async (): Promise<Tag[]> => {
    const response = await apiClient.get<Tag[]>('/api/tags');
    return response.data;
  },
  
  // 태그 생성
  createTag: async (tagData: TagRequest): Promise<Tag> => {
    const response = await apiClient.post<Tag>('/api/tags', tagData);
    return response.data;
  },
  
  // 태그 수정
  updateTag: async (id: string, tagData: TagUpdateRequest): Promise<Tag> => {
    const response = await apiClient.put<Tag>(`/api/tags/${id}`, tagData);
    return response.data;
  },
  
  // 태그 삭제
  deleteTag: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/tags/${id}`);
  }
};

export default tagService;
export type { TagRequest, TagUpdateRequest }; 