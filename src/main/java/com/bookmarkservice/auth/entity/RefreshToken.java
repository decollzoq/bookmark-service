package com.bookmarkservice.auth.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "refresh_tokens")
@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {
    @Id
    private String userId;
    private String refreshToken;
}
