package com.bookmarkservice.category.dto;

import lombok.Getter;
import java.util.List;

@Getter
public class CategoryRequestDto {
    private String title;
    private List<String> tagNames;
    private Boolean isPublic;

}