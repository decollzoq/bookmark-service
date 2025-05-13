package com.bookmarkservice.tag.controller;

import com.bookmarkservice.tag.dto.TagRequestDto;
import com.bookmarkservice.tag.dto.TagResponseDto;
import com.bookmarkservice.tag.dto.TagUpdateRequestDto;
import com.bookmarkservice.tag.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {
    private final TagService tagService;

    // 사용자 태그 등록
    @PostMapping
    public ResponseEntity<TagResponseDto> createTag(
            @AuthenticationPrincipal String userId
            ,@RequestBody TagRequestDto dto
    ) {
        return ResponseEntity.ok(tagService.createTag(userId, dto));
    }

    // 사용자 태그 전체 조회 (최신순)
    @GetMapping
    public ResponseEntity<List<TagResponseDto>> getTags(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(tagService.getTagsByUser(userId));
    }

    // 사용자 태그 이름 수정
    @PutMapping("/{tagId}")
    public ResponseEntity<TagResponseDto> updateTag(
            @AuthenticationPrincipal String userId,
            @PathVariable String tagId,
            @RequestBody TagUpdateRequestDto dto
    ) {
        return ResponseEntity.ok(tagService.updateTag(userId, tagId, dto));
    }

    // 사용자 태그 삭제
    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> deleteTag(
            @AuthenticationPrincipal String userId,
            @PathVariable String tagId
    ) {
        tagService.deleteTag(userId, tagId);
        return ResponseEntity.noContent().build();
    }
}
