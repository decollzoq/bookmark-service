package com.bookmarkservice.category.dto;

import com.bookmarkservice.category.entity.Category;
import com.bookmarkservice.tag.dto.TagResponseDto;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
public class CategoryResponseDto {
    private final String id;
    private final String title;
    private final List<String> tagNames;
    private final boolean isPublic;
    private final LocalDateTime createdAt;

    public CategoryResponseDto(Category category, List<TagResponseDto> tags) {
        this.id = category.getId();
        this.title = category.getTitle();
        this.tagNames = tags.stream().map(TagResponseDto::getName).toList();
        this.isPublic = category.isPublic();
        this.createdAt = category.getCreatedAt();
    }
}
