package com.bookmarkservice.bookmark.dto;

import com.bookmarkservice.bookmark.entity.Bookmark;
import com.bookmarkservice.tag.dto.TagResponseDto;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class BookmarkResponseDto {
    private final String id;
    private String url;
    private String title;
    private String description;
    private boolean favorite;
    private LocalDateTime createdAt;
    private List<TagResponseDto> tagNames;

    public BookmarkResponseDto(Bookmark bookmark, List<TagResponseDto> tagDtos) {
        this.id = bookmark.getId();
        this.url = bookmark.getUrl();
        this.title = bookmark.getTitle();
        this.description = bookmark.getDescription();
        this.favorite = bookmark.isFavorite();
        this.createdAt = bookmark.getCreatedAt();
        this.tagNames = tagDtos;
    }
}
