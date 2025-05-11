package com.bookmarkservice.domain.email.controller;

import com.bookmarkservice.domain.email.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/email")
@RequiredArgsConstructor
public class EmailController {

    private final EmailVerificationService emailVerificationService;

    @PostMapping("/send-code")
    public ResponseEntity<?> sendCode(@RequestParam String email) {
        emailVerificationService.sendVerificationCode(email);
        return ResponseEntity.ok("인증 코드가 이메일로 전송되었습니다.");
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestParam String email,
                                        @RequestParam String code) {
        EmailVerificationService.VerificationResult result = emailVerificationService.verifyCodeWithResult(email, code);

        return switch (result) {
            case SUCCESS -> ResponseEntity.ok("이메일 인증 성공");
            case CODE_MISMATCH -> ResponseEntity.badRequest().body("인증 코드가 일치하지 않습니다.");
            case CODE_EXPIRED -> ResponseEntity.badRequest().body("인증 코드가 만료되었습니다.");
        };
    }
}
