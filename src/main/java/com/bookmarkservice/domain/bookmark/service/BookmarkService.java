package com.bookmarkservice.domain.bookmark.service;

import com.bookmarkservice.common.exception.ConflictException;
import com.bookmarkservice.common.exception.NotFoundException;
import com.bookmarkservice.domain.bookmark.dto.BookmarkRequestDto;
import com.bookmarkservice.domain.bookmark.dto.BookmarkResponseDto;
import com.bookmarkservice.domain.bookmark.dto.BookmarkUpdateRequestDto;
import com.bookmarkservice.domain.bookmark.entity.Bookmark;
import com.bookmarkservice.domain.bookmark.repository.BookmarkRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;

    public BookmarkResponseDto createBookmark(String userId, BookmarkRequestDto request) {
        if (bookmarkRepository.existsByUserIdAndUrl(userId, request.getUrl())) {
            throw new ConflictException("이미 존재하는 URL 입니다.");
        }

        Bookmark bookmark = Bookmark.builder()
                .userId(userId)
                .url(request.getUrl())
                .title(request.getTitle())
                .description(request.getDescription())
                .favorite(request.isFavorite())
                .createdAt(LocalDateTime.now())
                .build();

        return new BookmarkResponseDto(bookmarkRepository.save(bookmark));
    }

    public List<BookmarkResponseDto> getAllBookmarks(String userId) {
        return bookmarkRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(BookmarkResponseDto::new)
                .toList();
    }

    public List<BookmarkResponseDto> searchBookmarks(String userId, String keyword) {
        return bookmarkRepository.findByUserIdAndTitleContainingIgnoreCaseOrderByCreatedAtDesc(userId, keyword).stream()
                .map(BookmarkResponseDto::new)
                .toList();
    }

    public BookmarkResponseDto updateBookmark(String userId, String bookmarkId, BookmarkUpdateRequestDto request) {
        Bookmark bookmark = bookmarkRepository.findByIdAndUserId(bookmarkId, userId)
                .orElseThrow(() -> new NotFoundException("해당 북마크를 찾을 수 없습니다."));

        if (!bookmark.getUrl().equals(request.getUrl()) &&
                bookmarkRepository.existsByUserIdAndUrl(userId, request.getUrl())) {
            throw new ConflictException("이미 동일한 URL이 등록되어 있습니다.");
        }

        bookmark.setUrl(request.getUrl());
        bookmark.setTitle(request.getTitle());
        bookmark.setDescription(request.getDescription());
        bookmark.setFavorite(request.isFavorite());

        return new BookmarkResponseDto(bookmarkRepository.save(bookmark));
    }

    public void toggleFavorite(String userId, String bookmarkId) {
        Bookmark bookmark = bookmarkRepository.findById(bookmarkId)
                .filter(b -> b.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("해당 북마크를 찾을 수 없습니다."));

        bookmark.setFavorite(!bookmark.isFavorite());
        bookmarkRepository.save(bookmark);
    }

    public void deleteBookmark(String userId, String bookmarkId) {
        Bookmark bookmark = bookmarkRepository.findByIdAndUserId(bookmarkId, userId)
                .orElseThrow(() -> new NotFoundException("해당 북마크를 찾을 수 없습니다."));

        bookmarkRepository.delete(bookmark);
    }

}