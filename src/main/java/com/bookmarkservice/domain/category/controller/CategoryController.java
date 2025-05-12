package com.bookmarkservice.domain.category.controller;

import com.bookmarkservice.domain.category.dto.CategoryRequestDto;
import com.bookmarkservice.domain.category.dto.CategoryResponseDto;
import com.bookmarkservice.domain.category.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @PostMapping
    public ResponseEntity<CategoryResponseDto> createCategory(@AuthenticationPrincipal String userId,
                                                   @RequestBody CategoryRequestDto requestDto) {
        return ResponseEntity.ok(categoryService.createCategory(userId, requestDto));
    }

    @GetMapping
    public ResponseEntity<List<CategoryResponseDto>> getAll(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(categoryService.getMyCategories(userId));
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<CategoryResponseDto> updateCategory(@AuthenticationPrincipal String userId,
                                           @PathVariable String categoryId,
                                           @RequestBody CategoryRequestDto dto) {
        return ResponseEntity.ok(categoryService.updateCategory(userId, categoryId, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal String userId,
                                       @PathVariable String id) {
        categoryService.deleteCategory(userId, id);
        return ResponseEntity.noContent().build();
    }
}