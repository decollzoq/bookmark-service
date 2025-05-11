package com.bookmarkservice.domain.bookmark.dto;

import com.bookmarkservice.domain.bookmark.entity.Bookmark;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class BookmarkResponseDto {
    private final String id;
    private final String url;
    private final String title;
    private final String description;
    private final boolean favorite;
    private final LocalDateTime createdAt;

    public BookmarkResponseDto(Bookmark bookmark) {
        this.id = bookmark.getId();
        this.url = bookmark.getUrl();
        this.title = bookmark.getTitle();
        this.description = bookmark.getDescription();
        this.favorite = bookmark.isFavorite();
        this.createdAt = bookmark.getCreatedAt();
    }
}
