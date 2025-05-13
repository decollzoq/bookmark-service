package com.bookmarkservice.share.entity;


import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document("category_share_tokens")
@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShareToken {
    @Id
    private String token;

    private String categoryId;
    private LocalDateTime createdAt;
}
