package com.bookmarkservice.category.repository;

import com.bookmarkservice.category.entity.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CategoryRepository extends MongoRepository<Category, String> {
    List<Category> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Category> findByUserIdAndTagIdsContaining(String userId, String tagId);
    List<Category> findByIsPublicTrueAndTitleContainingIgnoreCase(String keyword);
    List<Category> findByIsPublicTrueAndTagIdsIn(List<String> tagIds);

}
