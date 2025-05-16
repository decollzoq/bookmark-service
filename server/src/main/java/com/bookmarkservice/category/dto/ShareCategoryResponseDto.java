package com.bookmarkservice.category.dto;

import com.bookmarkservice.bookmark.dto.BookmarkResponseDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class ShareCategoryResponseDto {
    private String id;
    private String title;
    private List<String> tagNames;
    private List<BookmarkResponseDto> bookmarks;
}
