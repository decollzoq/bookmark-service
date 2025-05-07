package com.bookmarkservice.user.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupRequestDto {
    private String email;
    private String password;
    private String nickname;

    @Getter
    public static class LoginRequestDto {
        private String email;
        private String password;
    }
}
