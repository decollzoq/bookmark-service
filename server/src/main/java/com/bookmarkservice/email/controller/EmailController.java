package com.bookmarkservice.email.controller;

import com.bookmarkservice.email.service.EmailVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/email")
@RequiredArgsConstructor
@Slf4j
public class EmailController {

    private final EmailVerificationService emailVerificationService;

    @PostMapping("/send-code")
    public ResponseEntity<?> sendCode(@RequestParam String email) {
        log.debug("이메일 인증 코드 요청 수신: {}", email);
        try {
            emailVerificationService.sendVerificationCode(email);
            log.debug("이메일 인증 코드 전송 완료: {}", email);
            return ResponseEntity.ok("인증 코드가 이메일로 전송되었습니다.");
        } catch (Exception e) {
            log.error("이메일 인증 코드 전송 실패: {}, 오류: {}", email, e.getMessage(), e);
            return ResponseEntity.badRequest().body("이메일 전송 실패: " + e.getMessage());
        }
    }

    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestParam String email,
                                        @RequestParam String code) {
        log.debug("이메일 인증 코드 확인 요청: 이메일={}, 코드={}", email, code);
        try {
            EmailVerificationService.VerificationResult result = emailVerificationService.verifyCodeWithResult(email, code);
            log.debug("이메일 인증 결과: 이메일={}, 결과={}", email, result);
            
            return switch (result) {
                case SUCCESS -> ResponseEntity.ok("이메일 인증 성공");
                case CODE_MISMATCH -> ResponseEntity.badRequest().body("인증 코드가 일치하지 않습니다.");
                case CODE_EXPIRED -> ResponseEntity.badRequest().body("인증 코드가 만료되었습니다.");
            };
        } catch (Exception e) {
            log.error("이메일 인증 처리 실패: {}, 오류: {}", email, e.getMessage(), e);
            return ResponseEntity.badRequest().body("인증 처리 중 오류 발생: " + e.getMessage());
        }
    }
}
