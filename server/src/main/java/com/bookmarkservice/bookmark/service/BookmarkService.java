package com.bookmarkservice.bookmark.service;

import com.bookmarkservice.bookmark.dto.BookmarkRequestDto;
import com.bookmarkservice.bookmark.dto.BookmarkResponseDto;
import com.bookmarkservice.bookmark.dto.BookmarkUpdateRequestDto;
import com.bookmarkservice.bookmark.entity.Bookmark;
import com.bookmarkservice.bookmark.repository.BookmarkRepository;
import com.bookmarkservice.category.entity.Category;
import com.bookmarkservice.category.repository.CategoryRepository;
import com.bookmarkservice.common.exception.NotFoundException;
import com.bookmarkservice.tag.dto.ResolvedTagsDto;
import com.bookmarkservice.tag.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final CategoryRepository categoryRepository;
    private final TagService tagService;

    public BookmarkResponseDto createBookmark(String userId, BookmarkRequestDto dto) {
        ResolvedTagsDto resolvedTags = tagService.resolveTagsFromNames(dto.getTagNames(), userId);
        Bookmark bookmark = Bookmark.builder()
                .userId(userId)
                .url(dto.getUrl())
                .title(dto.getTitle())
                .description(dto.getDescription())
                .favorite(dto.isFavorite())
                .tagIds(resolvedTags.getTagIds())
                .createdAt(LocalDateTime.now())
                .build();

        bookmarkRepository.save(bookmark);

        return new BookmarkResponseDto(bookmark, resolvedTags.getTags());
    }

    public List<BookmarkResponseDto> getAllBookmarks(String userId) {
        List<Bookmark> bookmarks = bookmarkRepository.findByUserId(userId);

        return bookmarks.stream()
                .map(b -> new BookmarkResponseDto(
                        b,
                        tagService.findTagsByIds(b.getTagIds())
                ))
                .collect(Collectors.toList());
    }


    public List<BookmarkResponseDto> getBookmarksByCategoryTags(String userId, String categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("카테고리를 찾을 수 없습니다."));

        List<Bookmark> bookmarks = bookmarkRepository.findByUserIdAndTagIdsInOrderByCreatedAtDesc(userId, category.getTagIds());

        return bookmarks.stream()
                .map(b -> new BookmarkResponseDto(
                        b,
                        tagService.findTagsByIds(b.getTagIds())
                ))
                .collect(Collectors.toList());
    }

    public List<BookmarkResponseDto> getFavoriteBookmarks(String userId) {
        List<Bookmark> bookmarks = bookmarkRepository.findByUserIdAndFavoriteIsTrueOrderByCreatedAtDesc(userId);

        return bookmarks.stream()
                .map(b -> new BookmarkResponseDto(
                        b,
                        tagService.findTagsByIds(b.getTagIds())
                ))
                .collect(Collectors.toList());
    }

    public List<BookmarkResponseDto> searchBookmarks(String userId, String keyword) {
        List<Bookmark> bookmarks = bookmarkRepository.findByUserIdAndTitleContainingIgnoreCase(userId, keyword);

        return bookmarks.stream()
                .map(b -> new BookmarkResponseDto(
                        b,
                        tagService.findTagsByIds(b.getTagIds())
                ))
                .collect(Collectors.toList());
    }

    public BookmarkResponseDto updateBookmark(String userId, String bookmarkId, BookmarkUpdateRequestDto dto) {
        Bookmark bookmark = bookmarkRepository.findById(bookmarkId)
                .filter(b -> b.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("북마크를 찾을 수 없습니다."));

        bookmark.setTitle(dto.getTitle());
        bookmark.setUrl(dto.getUrl());
        bookmark.setDescription(dto.getDescription());
        bookmark.setFavorite(dto.isFavorite());

        ResolvedTagsDto tags = tagService.resolveTagsFromNames(dto.getTagNames(), userId);
        bookmark.setTagIds(tags.getTagIds());

        bookmarkRepository.save(bookmark);

        return new BookmarkResponseDto(bookmark, tags.getTags());
    }

    public void toggleFavorite(String userId, String bookmarkId) {
        Bookmark bookmark = bookmarkRepository.findById(bookmarkId)
                .filter(b -> b.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("북마크를 찾을 수 없습니다."));

        bookmark.setFavorite(!bookmark.isFavorite());
        bookmarkRepository.save(bookmark);
    }

    public void deleteBookmark(String userId, String bookmarkId) {
        Bookmark bookmark = bookmarkRepository.findById(bookmarkId)
                .filter(b -> b.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("북마크를 찾을 수 없습니다."));

        bookmarkRepository.delete(bookmark);
    }

}