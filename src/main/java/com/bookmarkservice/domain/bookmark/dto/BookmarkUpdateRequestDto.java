package com.bookmarkservice.domain.bookmark.dto;

import lombok.Getter;

@Getter
public class BookmarkUpdateRequestDto {
    private String url;
    private String title;
    private String description;
    private boolean favorite;
}