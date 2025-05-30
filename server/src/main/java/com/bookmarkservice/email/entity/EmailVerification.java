package com.bookmarkservice.email.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "email_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmailVerification {
    @Id
    private String id;
    private String email;
    private String code;
    private LocalDateTime expiresAt;
    private boolean isVerified;
}
