package com.bookmarkservice.category.controller;

import com.bookmarkservice.bookmark.dto.BookmarkResponseDto;
import com.bookmarkservice.category.dto.CategoryRequestDto;
import com.bookmarkservice.category.dto.CategoryResponseDto;
import com.bookmarkservice.category.dto.CategoryUpdateRequestDto;
import com.bookmarkservice.category.dto.ShareCategoryResponseDto;
import com.bookmarkservice.category.service.CategoryService;
import com.bookmarkservice.share.service.ShareTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final ShareTokenService shareTokenService;

    // 사용자 카테고리 등록
    @PostMapping
    public ResponseEntity<CategoryResponseDto> createCategory(
            @AuthenticationPrincipal String userId,
            @RequestBody CategoryRequestDto dto
    ) {
        return ResponseEntity.ok(categoryService.createCategory(userId, dto));
    }

    // 공유 링크 생성
    @PostMapping("/{categoryId}/share-token")
    public ResponseEntity<String> generateShareToken(
            @AuthenticationPrincipal String userId,
            @PathVariable String categoryId
    ) {
        String token = shareTokenService.generateToken(categoryId, userId);
        return ResponseEntity.ok(token);
    }

    // 공유 받은 카테고리를 사용자 카테고리에 추가
    @PostMapping("/share/{token}/import")
    public ResponseEntity<CategoryResponseDto> importCategory(
            @AuthenticationPrincipal String userId,
            @PathVariable String token
    ) {
        return ResponseEntity.ok(categoryService.importCategory(userId, token));
    }

    // 사용자 카테고리 전체 조회
    @GetMapping
    public ResponseEntity<List<CategoryResponseDto>> getAll(
            @AuthenticationPrincipal String userId
    ) {
        return ResponseEntity.ok(categoryService.getMyCategories(userId));
    }

    // 사용자 카테고리에 포함되는 북마크 리스트 조회
    @GetMapping("/{categoryId}/bookmarks")
    public ResponseEntity<List<BookmarkResponseDto>> getBookmarksByCategory(
            @AuthenticationPrincipal String userId,
            @PathVariable String categoryId) {
        return ResponseEntity.ok(categoryService.getBookmarksByCategory(userId, categoryId));
    }

    // 공유 받은 카테고리 조회
    @GetMapping("/share/{token}")
    public ResponseEntity<ShareCategoryResponseDto> getSharedCategory(@PathVariable String token) {
        return ResponseEntity.ok(categoryService.getCategoryByShareToken(token));
    }

    // 사용자 카테고리 수정
    @PutMapping("/{categoryId}")
    public ResponseEntity<CategoryResponseDto> updateCategory(
            @AuthenticationPrincipal String userId,
            @PathVariable String categoryId,
            @RequestBody CategoryUpdateRequestDto dto
    ) {
        return ResponseEntity.ok(categoryService.updateCategory(userId, categoryId, dto));
    }

    // 사용자 카테고리 공개 비공개 토글
    @PatchMapping("/{categoryId}/visibility")
    public ResponseEntity<Void> toggleVisibility(
            @AuthenticationPrincipal String userId,
            @PathVariable String categoryId) {
        categoryService.toggleVisibility(userId, categoryId);
        return ResponseEntity.ok().build();
    }

    // 사용자 카테고리 삭제
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Void> deleteCategory(
            @AuthenticationPrincipal String userId,
            @PathVariable String categoryId
    ) {
        categoryService.deleteCategory(userId, categoryId);
        return ResponseEntity.noContent().build();
    }

    // 사용자 카테고리 공유 상태 해제
    @DeleteMapping("/{categoryId}/share-token")
    public ResponseEntity<Void> deleteShareToken(
            @AuthenticationPrincipal String userId,
            @PathVariable String categoryId
    ) {
        shareTokenService.deleteTokenByCategoryId(categoryId, userId);
        return ResponseEntity.noContent().build();
    }
}
