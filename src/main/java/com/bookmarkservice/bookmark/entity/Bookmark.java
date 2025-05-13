package com.bookmarkservice.bookmark.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "bookmarks")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class Bookmark {
    @Id
    private String id;

    private String userId;
    private String url;
    private String title;
    private String description;
    private boolean favorite;

    private List<String> tagIds;
    private LocalDateTime createdAt;
}
