package com.bookmarkservice.tag.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ResolvedTagsDto {
    private List<String> tagIds;
    private List<TagResponseDto> tags;
}