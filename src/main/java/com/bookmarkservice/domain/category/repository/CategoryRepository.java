package com.bookmarkservice.domain.category.repository;

import com.bookmarkservice.domain.category.entity.Category;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CategoryRepository extends MongoRepository<Category, String> {
    List<Category> findByUserId(String userId);
}
