package com.bookmarkservice.repository;

import com.bookmarkservice.entity.EmailVerification;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface EmailVerificationRepository extends MongoRepository<EmailVerification, String> {
    Optional<EmailVerification> findByEmail(String email);
}
