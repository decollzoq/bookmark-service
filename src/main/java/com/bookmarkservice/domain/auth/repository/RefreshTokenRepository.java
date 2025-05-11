package com.bookmarkservice.domain.auth.repository;

import com.bookmarkservice.domain.auth.entity.RefreshToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RefreshTokenRepository extends MongoRepository<RefreshToken, String> {
    Optional<RefreshToken> findByUserId(String userId);
    Optional<RefreshToken> findByRefreshToken(String refreshToken);
}
