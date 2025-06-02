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
    
    // favorite 필드에 대한 getter 메서드 추가 (isFavorite 호환성을 위해)
    public boolean isFavorite() {
        return favorite;
    }
}
