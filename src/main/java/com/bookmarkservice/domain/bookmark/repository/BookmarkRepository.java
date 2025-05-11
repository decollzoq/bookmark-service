package com.bookmarkservice.domain.bookmark.repository;

import com.bookmarkservice.domain.bookmark.entity.Bookmark;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface BookmarkRepository extends MongoRepository<Bookmark, String> {
    List<Bookmark> findAllByUserIdOrderByCreatedAtDesc(String userId);

    Optional<Bookmark> findByIdAndUserId(String id, String userId);

    boolean existsByUserIdAndUrl(String userId, String url);

    List<Bookmark> findByUserIdAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(String userId, String keyword);

}
