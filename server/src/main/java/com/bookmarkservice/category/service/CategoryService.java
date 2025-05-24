package com.bookmarkservice.category.service;

import com.bookmarkservice.bookmark.dto.BookmarkResponseDto;
import com.bookmarkservice.bookmark.entity.Bookmark;
import com.bookmarkservice.bookmark.repository.BookmarkRepository;
import com.bookmarkservice.bookmark.service.BookmarkService;
import com.bookmarkservice.category.dto.CategoryRequestDto;
import com.bookmarkservice.category.dto.CategoryResponseDto;
import com.bookmarkservice.category.dto.CategoryUpdateRequestDto;
import com.bookmarkservice.category.dto.ShareCategoryResponseDto;
import com.bookmarkservice.category.entity.Category;
import com.bookmarkservice.category.repository.CategoryRepository;
import com.bookmarkservice.common.exception.NotFoundException;
import com.bookmarkservice.share.repository.ShareTokenRepository;
import com.bookmarkservice.share.service.ShareTokenService;
import com.bookmarkservice.tag.dto.ResolvedTagsDto;
import com.bookmarkservice.tag.dto.TagResponseDto;
import com.bookmarkservice.tag.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final TagService tagService;
    private final ShareTokenService shareTokenService;
    private final BookmarkRepository bookmarkRepository;
    private final ShareTokenRepository shareTokenRepository;
    private final BookmarkService bookmarkService;

    public CategoryResponseDto createCategory(String userId, CategoryRequestDto dto) {
        ResolvedTagsDto tags = tagService.resolveTagsFromNames(dto.getTagNames(), userId);

        Category category = Category.builder()
                .userId(userId)
                .title(dto.getTitle())
                .tagIds(tags.getTagIds())
                .isPublic(dto.getIsPublic())
                .createdAt(LocalDateTime.now())
                .build();

        return new CategoryResponseDto(categoryRepository.save(category), tags.getTags());
    }

    public List<CategoryResponseDto> getMyCategories(String userId) {
        List<Category> categories = categoryRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return categories.stream()
                .map(category -> {
                    List<TagResponseDto> tagDtos = tagService.findTagsByIds(category.getTagIds());
                    return new CategoryResponseDto(category, tagDtos);
                })
                .toList();
    }

    public List<BookmarkResponseDto> getBookmarksByCategory(String userId, String categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("카테고리를 찾을 수 없습니다."));

        return bookmarkService.getBookmarksByTagIds(userId, category.getTagIds());
    }


    public CategoryResponseDto updateCategory(String userId, String categoryId, CategoryUpdateRequestDto dto) {
        Category category = categoryRepository.findById(categoryId)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("카테고리를 찾을 수 없습니다."));

        ResolvedTagsDto tags = tagService.resolveTagsFromNames(dto.getTagNames(), userId);

        category.setTitle(dto.getTitle());
        category.setTagIds(tags.getTagIds());
        category.setIsPublic(dto.getIsPublic());

        categoryRepository.save(category);

        return new CategoryResponseDto(category, tags.getTags());
    }

    public void toggleVisibility(String userId, String categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("카테고리를 찾을 수 없습니다."));

        category.setIsPublic(!category.getIsPublic());
        categoryRepository.save(category);
    }

    public ShareCategoryResponseDto getCategoryByShareToken(String token) {
        // 1. 토큰 → 카테고리 ID 조회
        String categoryId = shareTokenService.getCategoryIdByToken(token);

        // 2. 카테고리 조회
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("카테고리를 찾을 수 없습니다."));

        // 3. 태그 조회
        List<TagResponseDto> tags = tagService.findTagsByIds(category.getTagIds());

        // 4. 해당 태그 포함하는 북마크 조회 (최신순)
        List<Bookmark> bookmarks = bookmarkRepository.findByUserIdAndTagIdsInOrderByCreatedAtDesc(
                category.getUserId(), category.getTagIds()
        );

        // 5. 북마크 DTO 변환
        List<BookmarkResponseDto> bookmarkDtos = bookmarks.stream()
                .map(b -> new BookmarkResponseDto(b, tagService.findTagsByIds(b.getTagIds())))
                .toList();

        // 6. 응답 생성
        return ShareCategoryResponseDto.builder()
                .id(category.getId())
                .title(category.getTitle())
                .tagNames(tags.stream().map(TagResponseDto::getName).toList())
                .bookmarks(bookmarkDtos)
                .build();
    }

    public CategoryResponseDto importCategory(String userId, String token) {
        // 공유 토큰 → 원본 카테고리 ID
        String categoryId = shareTokenService.getCategoryIdByToken(token);

        // 원본 카테고리 로드
        Category source = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new NotFoundException("카테고리를 찾을 수 없습니다."));

        // 새 카테고리 생성
        Category copy = Category.builder()
                .userId(userId)
                .title(source.getTitle())
                .tagIds(source.getTagIds()) // 태그는 동일한 것 사용
                .isPublic(false) // 복사본은 기본 비공개
                .createdAt(LocalDateTime.now())
                .build();

        categoryRepository.save(copy);

        return new CategoryResponseDto(copy, tagService.findTagsByIds(copy.getTagIds()));
    }

    public void deleteCategory(String userId, String categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("카테고리를 찾을 수 없습니다."));

        // 1. 카테고리 삭제
        categoryRepository.delete(category);

        // 2. 공유 토큰도 같이 삭제 (선택적)
        shareTokenRepository.findByCategoryId(categoryId)
                .ifPresent(shareTokenRepository::delete);
    }
}
