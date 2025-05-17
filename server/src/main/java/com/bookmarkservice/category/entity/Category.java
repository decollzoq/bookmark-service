package com.bookmarkservice.category.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "categories")
public class Category {
    @Id
    private String id;
    private String userId;
    private String title;
    private List<String> tagIds;
    private Boolean isPublic;
    private LocalDateTime createdAt;
}
