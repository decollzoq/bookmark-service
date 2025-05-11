package com.bookmarkservice.common.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKeyRaw;

    @Value("${jwt.expiration}")
    private long expiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private Key secretKey;

    @PostConstruct
    public void init() {
        this.secretKey = Keys.hmacShaKeyFor(secretKeyRaw.getBytes());
    }

    // JWT 생성 (userId 기반)
    public String generateToken(String userId) {
        Date now = new Date();
        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + expiration))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // 토큰 재생성
    public String generateRefreshToken(String userId) {
        Date now = new Date();

        return Jwts.builder()
                .setSubject(userId)
                .setIssuedAt(now)
                .setExpiration(new Date(now.getTime() + refreshExpiration))
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }


    // 토큰에서 userId 추출
    public String getUserIdFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    // 토큰 유효성 검사
    public boolean isValid(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(secretKey).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // Authorization 헤더에서 토큰 추출
    public String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        if (bearer != null && bearer.startsWith("Bearer ")) {
            return bearer.substring(7);
        }
        return null;
    }
}
