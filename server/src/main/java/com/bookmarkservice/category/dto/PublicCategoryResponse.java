package com.bookmarkservice.category.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PublicCategoryResponse {
    private String categoryId;
    private String title;
    private List<String> tagIds;
    private LocalDateTime createdAt;
    private UserInfo user;

    @Data
    @Builder
    public static class UserInfo {
        private String userId;
        private String username;
    }
}