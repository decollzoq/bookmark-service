package com.bookmarkservice.share.service;

import com.bookmarkservice.category.entity.Category;
import com.bookmarkservice.category.repository.CategoryRepository;
import com.bookmarkservice.common.exception.NotFoundException;
import com.bookmarkservice.share.entity.ShareToken;
import com.bookmarkservice.share.repository.ShareTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShareTokenService {

    private final ShareTokenRepository shareTokenRepository;
    private final CategoryRepository categoryRepository;

    public String generateToken(String categoryId, String userId) {
        Category category = categoryRepository.findById(categoryId)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("카테고리를 찾을 수 없습니다."));

        Optional<ShareToken> existing = shareTokenRepository.findByCategoryId(categoryId);
        if (existing.isPresent()) {
            return existing.get().getToken();
        }

        String token = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        ShareToken shareToken = ShareToken.builder()
                .token(token)
                .categoryId(categoryId)
                .createdAt(LocalDateTime.now())
                .build();

        shareTokenRepository.save(shareToken);
        return token;
    }

    public String getCategoryIdByToken(String token) {
        return shareTokenRepository.findByToken(token)
                .map(ShareToken::getCategoryId)
                .orElseThrow(() -> new NotFoundException("유효하지 않은 공유 링크입니다."));
    }

    public void deleteTokenByCategoryId(String categoryId, String userId) {
        Category category = categoryRepository.findById(categoryId)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("카테고리를 찾을 수 없습니다."));

        shareTokenRepository.findByCategoryId(categoryId)
                .ifPresent(shareTokenRepository::delete);
    }
}
