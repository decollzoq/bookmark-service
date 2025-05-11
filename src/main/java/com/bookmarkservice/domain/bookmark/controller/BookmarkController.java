package com.bookmarkservice.domain.bookmark.controller;

import com.bookmarkservice.common.jwt.JwtTokenProvider;
import com.bookmarkservice.domain.bookmark.dto.BookmarkRequestDto;
import com.bookmarkservice.domain.bookmark.dto.BookmarkResponseDto;
import com.bookmarkservice.domain.bookmark.dto.BookmarkUpdateRequestDto;
import com.bookmarkservice.domain.bookmark.service.BookmarkService;
import jakarta.servlet.http.HttpServletRequest;
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
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping
    public ResponseEntity<BookmarkResponseDto> createBookmark(@RequestBody BookmarkRequestDto request, HttpServletRequest httpServletRequest) {
        String token = jwtTokenProvider.resolveToken(httpServletRequest);
        String userId = jwtTokenProvider.getUserIdFromToken(token);

        BookmarkResponseDto response = bookmarkService.createBookmark(userId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<BookmarkResponseDto>> getAll(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(bookmarkService.getAllBookmarks(userId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<BookmarkResponseDto>> search(
            @AuthenticationPrincipal String userId,
            @RequestParam("keyword") String keyword) {
        return ResponseEntity.ok(bookmarkService.searchBookmarks(userId, keyword));
    }

    @PutMapping("/{bookmarkId}")
    public ResponseEntity<BookmarkResponseDto> updateBookmark(
            @PathVariable String bookmarkId,
            @RequestBody BookmarkUpdateRequestDto request,
            @AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(bookmarkService.updateBookmark(userId, bookmarkId, request));
    }

    @PatchMapping("/{bookmarkId}/favorite")
    public ResponseEntity<Void> toggleFavorite(@PathVariable String bookmarkId,
                                               @AuthenticationPrincipal String userId) {
        bookmarkService.toggleFavorite(userId, bookmarkId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{bookmarkId}")
    public ResponseEntity<Void> deleteBookmark(
            @PathVariable String bookmarkId,
            @AuthenticationPrincipal String userId) {

        bookmarkService.deleteBookmark(userId, bookmarkId);
        return ResponseEntity.noContent().build();
    }


}
