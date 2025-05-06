package com.bookmarkservice.service;

import com.bookmarkservice.entity.EmailVerification;
import com.bookmarkservice.repository.EmailVerificationRepository;
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

    public void sendVerificationCode(String email) {
        String code = generateRandomCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(5);

        mailService.sendMail(email, "[북마크 서비스] 이메일 인증코드", "인증코드: " + code);

        EmailVerification verification = new EmailVerification(null, email, code, expiresAt, false);
        repository.save(verification);
    }

    public VerificationResult verifyCodeWithResult(String email, String code) {
        return repository.findByEmail(email)
                .map(v -> {
                    if (!v.getCode().equals(code)) return VerificationResult.CODE_MISMATCH;
                    if (v.getExpiresAt().isBefore(LocalDateTime.now())) return VerificationResult.CODE_EXPIRED;

                    v.setVerified(true);                // ✅ 인증 성공 시 인증 처리
                    repository.save(v);
                    return VerificationResult.SUCCESS;
                })
                .orElse(VerificationResult.CODE_MISMATCH);
    }

    public boolean canRegister(String email) {
        return repository.findByEmail(email)
                .map(EmailVerification::isVerified)
                .orElse(false);
    }

    private String generateRandomCode() {
        return String.valueOf((int)(Math.random() * 900000) + 100000); // 6자리 숫자
    }
}
