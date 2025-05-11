package com.bookmarkservice.domain.bookmark.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookmarkRequestDto {
    private String url;
    private String title;
    private String description;
    private boolean favorite;
}
