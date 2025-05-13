package com.bookmarkservice.category.controller;

import com.bookmarkservice.category.dto.PublicCategoryResponse;
import com.bookmarkservice.category.service.CategorySearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/public/categories")
public class CategorySearchController {

    private final CategorySearchService categorySearchService;

    @GetMapping("/search/title")
    public ResponseEntity<List<PublicCategoryResponse>> searchByTitle(@RequestParam String keyword) {
        return ResponseEntity.ok(categorySearchService.searchByTitle(keyword));
    }

    @GetMapping("/search/tags")
    public ResponseEntity<List<PublicCategoryResponse>> searchByTags(@RequestParam List<String> tagIds) {
        return ResponseEntity.ok(categorySearchService.searchByTags(tagIds));
    }
}
