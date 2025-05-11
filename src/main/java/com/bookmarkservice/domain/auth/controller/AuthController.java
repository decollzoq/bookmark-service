package com.bookmarkservice.domain.auth.controller;

import com.bookmarkservice.common.jwt.JwtTokenProvider;
import com.bookmarkservice.domain.auth.dto.LoginRequestDto;
import com.bookmarkservice.domain.auth.dto.LoginResponseDto;
import com.bookmarkservice.domain.auth.dto.TokenReissueRequestDto;
import com.bookmarkservice.domain.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/reissue")
    public ResponseEntity<LoginResponseDto> reissue(@RequestBody TokenReissueRequestDto request) {
        return ResponseEntity.ok(authService.reissue(request.getRefreshToken()));
    }
}
