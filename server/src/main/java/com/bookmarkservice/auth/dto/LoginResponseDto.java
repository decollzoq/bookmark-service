package com.bookmarkservice.auth.dto;

import com.bookmarkservice.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponseDto {
    private String accessToken;
    private String refreshToken;
    private UserInfoDto user;

    // accessToken과 refreshToken만 있는 생성자
    public LoginResponseDto(String accessToken, String refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.user = null;
    }

    // 모든 필드가 있는 생성자
    public LoginResponseDto(String accessToken, String refreshToken, User user) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        if (user != null) {
            this.user = new UserInfoDto(user);
        } else {
            this.user = null;
        }
    }

    // 중첩 클래스로 사용자 정보 DTO 정의
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfoDto {
        private String id;
        private String email;
        private String nickname;

        public UserInfoDto(User user) {
            this.id = user.getId();
            this.email = user.getEmail();
            this.nickname = user.getNickname();
        }
    }
}
