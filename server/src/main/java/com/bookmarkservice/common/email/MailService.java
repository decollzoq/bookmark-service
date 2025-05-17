package com.bookmarkservice.common.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {
    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;
    
    public void sendMail(String to, String subject, String body) {
        try {
            log.debug("이메일 전송 시도: 수신자={}, 제목={}", to, subject);
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setFrom(fromEmail);
            message.setSubject(subject);
            message.setText(body);
            
            mailSender.send(message);
            
            log.debug("이메일 전송 성공: 수신자={}", to);
        } catch (Exception e) {
            log.error("이메일 전송 실패: 수신자={}, 오류={}", to, e.getMessage(), e);
            throw new RuntimeException("이메일 전송 실패: " + e.getMessage(), e);
        }
    }
}
