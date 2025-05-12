package com.bookmarkservice.domain.category.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "categories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Category {
    @Id
    private String id;

    private String userId;
    private String title;
    private List<String> conditionTags; // 조건 태그 리스트
    private boolean isPublic;
}

