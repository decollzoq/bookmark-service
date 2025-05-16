package com.bookmarkservice.tag.dto;

import com.bookmarkservice.tag.entity.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter @Builder
@AllArgsConstructor
@NoArgsConstructor
public class TagResponseDto {
    private String id;
    private String name;

    // TagResponseDto.java
    public TagResponseDto(Tag tag) {
        this.id = tag.getId();
        this.name = tag.getName();
    }

}
