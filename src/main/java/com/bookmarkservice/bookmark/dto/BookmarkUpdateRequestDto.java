package com.bookmarkservice.bookmark.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BookmarkUpdateRequestDto {
    private String title;
    private String url;
    private String description;
    private boolean favorite;
    private List<String> tagNames;
}
