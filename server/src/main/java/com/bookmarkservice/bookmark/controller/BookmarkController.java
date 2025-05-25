package com.bookmarkservice.bookmark.controller;

import com.bookmarkservice.bookmark.dto.BookmarkRequestDto;
import com.bookmarkservice.bookmark.dto.BookmarkUpdateRequestDto;
import com.bookmarkservice.bookmark.dto.BookmarkResponseDto;
import com.bookmarkservice.bookmark.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    // 사용자 북마크 등록
    @PostMapping
    public ResponseEntity<BookmarkResponseDto> createBookmark(
            @RequestBody BookmarkRequestDto request,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(bookmarkService.createBookmark(userId, request));
    }

    // 사용자 북마크 태그 조회 (최신순)
    @GetMapping
    public ResponseEntity<List<BookmarkResponseDto>> getAll(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(bookmarkService.getAllBookmarks(userId));
    }

    // 사용자 북마크 제목 검색 (소/대문자 구별 없음)
    @GetMapping("/search")
    public ResponseEntity<List<BookmarkResponseDto>> search(
            @AuthenticationPrincipal String userId,
            @RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(bookmarkService.searchBookmarks(userId, keyword));
    }

    // 공개 카테고리 북마크 검색 (인증 불필요)
    @GetMapping("/search/public-categories")
    public ResponseEntity<List<BookmarkResponseDto>> searchPublicCategories(
            @RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(bookmarkService.searchPublicCategoryBookmarks(keyword));
    }

    // 즐겨찾기한 사용자 북마크 조회
    @GetMapping("/favorites")
    public ResponseEntity<List<BookmarkResponseDto>> getFavorites(
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(bookmarkService.getFavoriteBookmarks(userId));
    }

    // 사용자 북마크 업데이트 (전체 필드 다 적어야 함)
    @PutMapping("/{bookmarkId}")
    public ResponseEntity<BookmarkResponseDto> updateBookmark(
            @PathVariable String bookmarkId,
            @RequestBody BookmarkUpdateRequestDto request,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(bookmarkService.updateBookmark(userId, bookmarkId, request));
    }

    // 사용자 북마크 즐겨찾기 토글
    @PatchMapping("/{bookmarkId}/favorite")
    public ResponseEntity<Void> toggleFavorite(
            @PathVariable String bookmarkId,
            @AuthenticationPrincipal String userId) {
        bookmarkService.toggleFavorite(userId, bookmarkId);
        return ResponseEntity.ok().build();
    }

    // 사용자 북마크 삭제
    @DeleteMapping("/{bookmarkId}")
    public ResponseEntity<Void> deleteBookmark(
            @PathVariable String bookmarkId,
            @AuthenticationPrincipal String userId) {
        bookmarkService.deleteBookmark(userId, bookmarkId);
        return ResponseEntity.noContent().build();
    }
}
