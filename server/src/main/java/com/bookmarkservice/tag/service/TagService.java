package com.bookmarkservice.tag.service;

import com.bookmarkservice.bookmark.entity.Bookmark;
import com.bookmarkservice.bookmark.repository.BookmarkRepository;
import com.bookmarkservice.category.entity.Category;
import com.bookmarkservice.category.repository.CategoryRepository;
import com.bookmarkservice.common.exception.ConflictException;
import com.bookmarkservice.common.exception.DuplicateTagException;
import com.bookmarkservice.common.exception.NotFoundException;
import com.bookmarkservice.tag.dto.ResolvedTagsDto;
import com.bookmarkservice.tag.dto.TagRequestDto;
import com.bookmarkservice.tag.dto.TagResponseDto;
import com.bookmarkservice.tag.dto.TagUpdateRequestDto;
import com.bookmarkservice.tag.entity.Tag;
import com.bookmarkservice.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final BookmarkRepository bookmarkRepository;
    private final CategoryRepository categoryRepository;

    public TagResponseDto createTag(String userId, TagRequestDto dto) {
        tagRepository.findByUserIdAndName(userId, dto.getName()).ifPresent(tag -> {
            throw new ConflictException("이미 존재하는 태그입니다.");
        });

        Tag saved = tagRepository.save(Tag.builder()
                .userId(userId)
                .name(dto.getName())
                .createdAt(LocalDateTime.now())
                .build());

        return TagResponseDto.builder()
                .id(saved.getId())
                .name(saved.getName())
                .build();
    }

    public List<TagResponseDto> getTagsByUser(String userId) {
        return tagRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(TagResponseDto::new)
                .collect(Collectors.toList());
    }

    public TagResponseDto updateTag(String userId, String tagId, TagUpdateRequestDto dto) {
        // 중복 이름 체크
        tagRepository.findByUserIdAndName(userId, dto.getName()).ifPresent(tag -> {
            if (!tag.getId().equals(tagId)) {
                throw new DuplicateTagException("이미 존재하는 태그 이름입니다.");
            }
        });

        Tag tag = tagRepository.findByIdAndUserId(tagId, userId)
                .orElseThrow(() -> new NotFoundException("태그를 찾을 수 없습니다."));

        tag.setName(dto.getName());
        tagRepository.save(tag);

        return new TagResponseDto(tag);
    }

    public void deleteTag(String userId, String tagId) {
        Tag tag = tagRepository.findById(tagId)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new NotFoundException("태그를 찾을 수 없습니다."));

        // 태그 삭제
        tagRepository.delete(tag);

        // 연결된 북마크에서 제거
        List<Bookmark> bookmarks = bookmarkRepository.findByUserIdAndTagIdsContaining(userId, tagId);
        for (Bookmark b : bookmarks) {
            b.getTagIds().remove(tagId);
        }
        bookmarkRepository.saveAll(bookmarks);

        // 연결된 카테고리에서 제거
        List<Category> categories = categoryRepository.findByUserIdAndTagIdsContaining(userId, tagId);
        for (Category c : categories) {
            c.getTagIds().remove(tagId);
        }
        categoryRepository.saveAll(categories);
    }


    public List<TagResponseDto> findTagsByIds(List<String> tagIds) {
        return tagRepository.findAllById(tagIds).stream()
                .map(TagResponseDto::new)
                .collect(Collectors.toList());
    }

    public ResolvedTagsDto resolveTagsFromNames(List<String> tagNames, String userId) {
        if (tagNames == null || tagNames.isEmpty()){
            return new ResolvedTagsDto(List.of(), List.of());
        }

        List<Tag> existingTags = tagRepository.findByUserIdAndNameInIgnoreCase(userId, tagNames);

        Set<String> existingNames = existingTags.stream()
                .map(Tag::getName)
                .collect(Collectors.toSet());

        List<Tag> newTags = tagNames.stream()
                .filter(name -> !existingNames.contains(name))
                .map(name -> Tag.builder()
                        .userId(userId)
                        .name(name)
                        .createdAt(LocalDateTime.now())
                        .build())
                .toList();

        if (!newTags.isEmpty()) {
            tagRepository.saveAll(newTags);
        }

        List<Tag> allTags = Stream.concat(existingTags.stream(), newTags.stream()).toList();

        List<String> tagIds = allTags.stream().map(Tag::getId).toList();
        List<TagResponseDto> tagDtos = allTags.stream().map(TagResponseDto::new).toList();

        return new ResolvedTagsDto(tagIds, tagDtos);
    }
}
