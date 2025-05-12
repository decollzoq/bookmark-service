package com.bookmarkservice.domain.category.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CategoryResponseDto {
    private String id;
    private String title;
    private List<String> conditionTags;
    private boolean isPublic;
}