package com.bookmarkservice.domain.bookmark.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Getter @Setter@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookmarks")
public class Bookmark {
    @Id
    private String id;

    private String userId;
    private String url;
    private String title;
    private String description;
    private boolean favorite;

    private LocalDateTime createdAt;
}
