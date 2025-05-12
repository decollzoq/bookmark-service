package com.bookmarkservice.domain.tag.repository;

import com.bookmarkservice.domain.tag.entity.Tag;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends MongoRepository<Tag, String> {
    List<Tag> findByUserId(String userId);

    Optional<Tag> findByUserIdAndName(String userId, String name);
}
