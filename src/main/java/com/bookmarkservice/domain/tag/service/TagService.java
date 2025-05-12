package com.bookmarkservice.domain.tag.service;

import com.bookmarkservice.domain.tag.entity.Tag;
import com.bookmarkservice.domain.tag.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;

    public Tag createTag(String userId, String name) {
        if (tagRepository.findByUserIdAndName(userId, name).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 태그입니다.");
        }

        Tag tag = Tag.builder()
                .userId(userId)
                .name(name)
                .createdAt(LocalDateTime.now())
                .build();

        return tagRepository.save(tag);
    }

    public List<Tag> getTagsByUser(String userId) {
        return tagRepository.findByUserId(userId);
    }

    public Tag renameTag(String userId, String tagId, String newName) {
        Tag tag = tagRepository.findById(tagId)
                .filter(t -> t.getUserId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("해당 태그를 찾을 수 없습니다."));

        tag.setName(newName);
        return tagRepository.save(tag);
    }
}
