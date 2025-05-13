package com.bookmarkservice.share.repository;

import com.bookmarkservice.share.entity.ShareToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ShareTokenRepository extends MongoRepository<ShareToken, String> {
    Optional<ShareToken> findByToken(String token);
    Optional<ShareToken> findByCategoryId(String categoryId);
}
