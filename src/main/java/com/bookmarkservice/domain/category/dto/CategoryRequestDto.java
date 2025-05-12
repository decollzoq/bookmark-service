package com.bookmarkservice.domain.category.dto;

import lombok.Getter;
import java.util.List;

@Getter
public class CategoryRequestDto {
    private String title;
    private List<String> conditionTags;
    private boolean isPublic;
}