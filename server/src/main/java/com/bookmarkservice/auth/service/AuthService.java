package com.bookmarkservice.auth.service;

import com.bookmarkservice.common.exception.NotFoundException;
import com.bookmarkservice.common.exception.UnauthorizedException;
import com.bookmarkservice.common.jwt.JwtTokenProvider;
import com.bookmarkservice.auth.entity.RefreshToken;
import com.bookmarkservice.auth.repository.RefreshTokenRepository;
import com.bookmarkservice.auth.dto.LoginRequestDto;
import com.bookmarkservice.auth.dto.LoginResponseDto;
import com.bookmarkservice.user.entity.User;
import com.bookmarkservice.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public LoginResponseDto login(LoginRequestDto request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new NotFoundException("존재하지 않는 이메일입니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("비밀번호가 일치하지 않습니다.");
        }

        String accessToken = jwtTokenProvider.generateToken(user.getId());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .userId(user.getId())
                        .refreshToken(refreshToken)
                        .createdAt(LocalDateTime.now())
                        .build());

        return new LoginResponseDto(accessToken, refreshToken);
    }

    public LoginResponseDto reissue(String refreshToken) {
        String userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        RefreshToken token = refreshTokenRepository.findByUserId(userId)
                .orElseThrow(() -> new UnauthorizedException("리프레시 토큰이 존재하지 않습니다."));

        if (!token.getRefreshToken().equals(refreshToken)) {
            throw new UnauthorizedException("유효하지 않은 리프레시 토큰입니다.");
        }

        refreshTokenRepository.delete(token);

        String newAccessToken = jwtTokenProvider.generateToken(userId);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(userId);

        refreshTokenRepository.save(
                RefreshToken.builder()
                        .userId(userId)
                        .refreshToken(refreshToken)
                        .createdAt(LocalDateTime.now())
                        .build());

        return new LoginResponseDto(newAccessToken, newRefreshToken);
    }
}
