export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Tag {
  id: string;
  name: string;
  userId: string;
}

// API 응답에서 받을 수 있는 태그 타입
export interface ApiTag {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  title: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  tagList: Tag[];
  isPublic: boolean;
}

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string;
  tagList: Tag[];
  integrated: boolean;
  image?: string;
  isFavorite?: boolean;
}

export interface SharedLink {
  id: string;
  uuid: string;
  bookmarkId: string | null;
  categoryId: string | null;
  createdAt: string;
}

export interface RecentView {
  id: string;
  bookmarkId: string;
  viewedAt: string;
} 