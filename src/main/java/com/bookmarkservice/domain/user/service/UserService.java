package com.bookmarkservice.domain.user.service;

import com.bookmarkservice.common.jwt.JwtTokenProvider;
import com.bookmarkservice.domain.auth.dto.LoginRequestDto;
import com.bookmarkservice.domain.auth.dto.LoginResponseDto;
import com.bookmarkservice.domain.user.dto.RegisterDto;
import com.bookmarkservice.domain.user.entity.User;
import com.bookmarkservice.domain.email.service.EmailVerificationService;
import com.bookmarkservice.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EmailVerificationService emailVerificationService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public void signUp(RegisterDto request) {
        if (!emailVerificationService.canRegister(request.getEmail())) {
            throw new IllegalArgumentException("이메일 인증이 완료되지 않았습니다.");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNickname(request.getNickname());
        user.setEmailVerified(true);

        userRepository.save(user);
    }

    public LoginResponseDto login(LoginRequestDto request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이메일입니다."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        String accessToken = jwtTokenProvider.generateToken(user.getId());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());
        return new LoginResponseDto(accessToken, refreshToken);
    }

}
