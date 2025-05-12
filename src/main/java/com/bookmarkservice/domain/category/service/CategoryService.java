package com.bookmarkservice.domain.category.service;

import com.bookmarkservice.common.exception.NotFoundException;
import com.bookmarkservice.domain.category.dto.CategoryRequestDto;
import com.bookmarkservice.domain.category.dto.CategoryResponseDto;
import com.bookmarkservice.domain.category.entity.Category;
import com.bookmarkservice.domain.category.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryResponseDto createCategory(String userId, CategoryRequestDto requestDto) {
        Category category = Category.builder()
                .userId(userId)
                .title(requestDto.getTitle())
                .conditionTags(requestDto.getConditionTags())
                .isPublic(requestDto.isPublic())
                .build();

        Category saved = categoryRepository.save(category);
        return toResponseDto(saved);
    }

    public List<CategoryResponseDto> getMyCategories(String userId) {
        return categoryRepository.findByUserId(userId).stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    public CategoryResponseDto updateCategory(String userId, String categoryId, CategoryRequestDto dto) {
        Category category = categoryRepository.findById(categoryId)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("카테고리를 찾을 수 없습니다."));

        category.setTitle(dto.getTitle());
        category.setConditionTags(dto.getConditionTags());
        category.setPublic(dto.isPublic());

        Category updated = categoryRepository.save(category);
        return toResponseDto(updated);
    }

    public void deleteCategory(String userId, String categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("카테고리를 찾을 수 없습니다."));

        categoryRepository.delete(category);
    }

    private CategoryResponseDto toResponseDto(Category category) {
        return CategoryResponseDto.builder()
                .id(category.getId())
                .title(category.getTitle())
                .conditionTags(category.getConditionTags())
                .isPublic(category.isPublic())
                .build();
    }
}