package com.bookmarkservice.bookmark.repository;

import com.bookmarkservice.bookmark.entity.Bookmark;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends MongoRepository<Bookmark, String> {
    List<Bookmark> findByUserId(String userId);
    List<Bookmark> findByUserIdAndTitleContainingIgnoreCase(String userId, String keyword);
    List<Bookmark> findByUserIdAndTagIdsInOrderByCreatedAtDesc(String userId, List<String> tagIds);
    List<Bookmark> findByUserIdAndFavoriteIsTrueOrderByCreatedAtDesc(String userId);
    List<Bookmark> findByUserIdAndTagIdsContaining(String userId, String tagId);
    
    // 전체 북마크 검색 메서드들 (카테고리 기반 필터링용)
    List<Bookmark> findByTitleContainingIgnoreCase(String keyword);
    List<Bookmark> findByDescriptionContainingIgnoreCase(String keyword);
}

