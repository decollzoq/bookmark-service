package com.bookmarkservice.category.service;

import com.bookmarkservice.category.dto.PublicCategoryResponse;
import com.bookmarkservice.category.entity.Category;
import com.bookmarkservice.category.repository.CategoryRepository;
import com.bookmarkservice.user.entity.User;
import com.bookmarkservice.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategorySearchService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public List<PublicCategoryResponse> searchByTitle(String keyword) {
        List<Category> categories = categoryRepository.findByIsPublicTrueAndTitleContainingIgnoreCase(keyword);
        return convertToDto(categories);
    }

    public List<PublicCategoryResponse> searchByTags(List<String> tagIds) {
        List<Category> categories = categoryRepository.findByIsPublicTrueAndTagIdsIn(tagIds);
        return convertToDto(categories);
    }

    private List<PublicCategoryResponse> convertToDto(List<Category> categories) {
        return categories.stream().map(category -> {
            User user = userRepository.findById(category.getUserId())
                    .orElseThrow(() -> new RuntimeException("사용자 정보를 찾을 수 없습니다."));

            return PublicCategoryResponse.builder()
                    .categoryId(category.getId())
                    .title(category.getTitle())
                    .tagIds(category.getTagIds())
                    .createdAt(category.getCreatedAt())
                    .user(PublicCategoryResponse.UserInfo.builder()
                            .userId(user.getId())
                            .username(user.getNickname())  // 또는 user.getNickname() 등
                            .build())
                    .build();
        }).toList();
    }
}
