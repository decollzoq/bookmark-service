package com.bookmarkservice.email.service;

import com.bookmarkservice.common.email.MailService;
import com.bookmarkservice.email.entity.EmailVerification;
import com.bookmarkservice.email.repository.EmailVerificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailVerificationRepository repository;
    private final MailService mailService;

    public enum VerificationResult {
        SUCCESS, CODE_MISMATCH, CODE_EXPIRED
    }

    // 인증 코드 전송 로직
    public void sendVerificationCode(String email) {
        String code = generateRandomCode(); // 코드 생성
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);   // 유효시간 5분 설정

        mailService.sendMail(email, "[북마크 서비스] 이메일 인증코드", "인증코드: " + code); // 메일 전송

        EmailVerification verification = new EmailVerification(null, email, code, expiresAt, false);
        repository.save(verification);
    }

    public VerificationResult verifyCodeWithResult(String email, String code) {
        return repository.findByEmail(email)
                .map(v -> {
                    if (!v.getCode().equals(code)) return VerificationResult.CODE_MISMATCH;
                    if (v.getExpiresAt().isBefore(LocalDateTime.now())) return VerificationResult.CODE_EXPIRED;

                    v.setVerified(true);
                    repository.save(v);
                    return VerificationResult.SUCCESS;
                })
                .orElse(VerificationResult.CODE_MISMATCH);
    }

    private String generateRandomCode() {
        return String.valueOf((int)(Math.random() * 900000) + 100000); // 6자리 숫자
    }

    public boolean canRegister(String email) {
        return repository.findByEmail(email)
                .map(EmailVerification::isVerified)
                .orElse(false);
    }
}
