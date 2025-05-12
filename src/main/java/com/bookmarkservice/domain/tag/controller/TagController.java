package com.bookmarkservice.domain.tag.controller;

import com.bookmarkservice.domain.tag.entity.Tag;
import com.bookmarkservice.domain.tag.service.TagService;
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

    @PostMapping
    public ResponseEntity<Tag> createTag(@AuthenticationPrincipal String userId,
                                         @RequestParam String name) {
        return ResponseEntity.ok(tagService.createTag(userId, name));
    }

    @GetMapping
    public ResponseEntity<List<Tag>> getMyTags(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(tagService.getTagsByUser(userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tag> renameTag(@AuthenticationPrincipal String userId,
                                         @PathVariable String id,
                                         @RequestParam String newName) {
        return ResponseEntity.ok(tagService.renameTag(userId, id, newName));
    }
}
