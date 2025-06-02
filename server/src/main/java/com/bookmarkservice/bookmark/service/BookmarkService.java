package com.bookmarkservice.bookmark.service;

import com.bookmarkservice.bookmark.dto.BookmarkRequestDto;
import com.bookmarkservice.bookmark.dto.BookmarkResponseDto;
import com.bookmarkservice.bookmark.dto.BookmarkUpdateRequestDto;
import com.bookmarkservice.bookmark.entity.Bookmark;
import com.bookmarkservice.bookmark.repository.BookmarkRepository;
import com.bookmarkservice.tag.dto.TagResponseDto;
import com.bookmarkservice.common.exception.NotFoundException;
import com.bookmarkservice.tag.dto.ResolvedTagsDto;
import com.bookmarkservice.tag.repository.TagRepository;
import com.bookmarkservice.tag.service.TagService;
import com.bookmarkservice.category.repository.CategoryRepository;
import com.bookmarkservice.category.entity.Category;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final TagService tagService;
    private final TagRepository tagRepository;
    private final CategoryRepository categoryRepository;

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


    public List<BookmarkResponseDto> getBookmarksByTagIds(String userId, List<String> tagIds) {
        return bookmarkRepository.findByUserIdAndTagIdsInOrderByCreatedAtDesc(userId, tagIds)
                .stream()
                .map(b -> new BookmarkResponseDto(
                        b,
                        tagRepository.findAllById(b.getTagIds()).stream()
                                .map(TagResponseDto::new)
                                .toList()
                ))
                .toList();
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

    // 공개 카테고리 북마크 검색
    public List<BookmarkResponseDto> searchPublicCategoryBookmarks(String keyword) {
        // 1. 모든 공개 카테고리들 조회 (키워드 제한 없이)
        List<Category> publicCategories = categoryRepository.findByIsPublicTrue();
        
        // 2. 공개 카테고리들의 태그 ID 수집
        List<String> publicTagIds = publicCategories.stream()
                .flatMap(category -> category.getTagIds().stream())
                .distinct()
                .collect(Collectors.toList());
        
        if (publicTagIds.isEmpty()) {
            return List.of(); // 공개 카테고리가 없으면 빈 리스트 반환
        }
        
        // 3. 공개 카테고리의 태그를 가진 모든 북마크 조회
        List<Bookmark> publicCategoryBookmarks = bookmarkRepository.findByTagIdsInOrderByCreatedAtDesc(publicTagIds);

        // 4. 키워드로 필터링 (제목, 설명, URL에서 검색)
        return publicCategoryBookmarks.stream()
                .filter(bookmark -> {
                    String lowerKeyword = keyword.toLowerCase();
                    return bookmark.getTitle().toLowerCase().contains(lowerKeyword) ||
                           (bookmark.getDescription() != null && bookmark.getDescription().toLowerCase().contains(lowerKeyword)) ||
                           bookmark.getUrl().toLowerCase().contains(lowerKeyword);
                })
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