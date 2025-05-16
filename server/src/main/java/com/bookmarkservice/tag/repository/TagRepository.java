package com.bookmarkservice.tag.repository;

import com.bookmarkservice.tag.entity.Tag;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends MongoRepository<Tag, String> {
    Optional<Tag> findByUserIdAndName(String userId, String name);
    Optional<Tag> findByIdAndUserId(String id,String userId);
    List<Tag> findByUserIdAndNameInIgnoreCase(String userId, List<String> tagNames);
    List<Tag> findByUserIdOrderByCreatedAtDesc(String userId);
}
