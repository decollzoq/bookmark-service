package com.bookmarkservice.common.jwt;

import com.bookmarkservice.common.exception.UnauthorizedException;
import com.bookmarkservice.user.entity.User;
import com.bookmarkservice.user.repository.UserRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.Optional;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKeyRaw;

    @Value("${jwt.expiration}")
    private long expiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    private Key secretKey;
    
    @Autowired
    private UserRepository userRepository;

    @PostConstruct
    public void init() {
        this.secretKey = Keys.hmacShaKeyFor(secretKeyRaw.getBytes());
    }

    // JWT 생성 (userId 기반)
    public String generateToken(String userId) {
        Date now = new Date();
        
        // 사용자의 닉네임 정보 조회
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // 닉네임 정보를 토큰에 추가
            return Jwts.builder()
                    .setSubject(userId)
                    .claim("nickname", user.getNickname()) // 닉네임 정보 추가
                    .setIssuedAt(now)
                    .setExpiration(new Date(now.getTime() + expiration))
                    .signWith(secretKey, SignatureAlgorithm.HS256)
                    .compact();
        } else {
            // 사용자 정보를 찾을 수 없는 경우, 기본 토큰 생성
            return Jwts.builder()
                    .setSubject(userId)
                    .setIssuedAt(now)
                    .setExpiration(new Date(now.getTime() + expiration))
                    .signWith(secretKey, SignatureAlgorithm.HS256)
                    .compact();
        }
    }

    // 토큰 재생성
    public String generateRefreshToken(String userId) {
        Date now = new Date();
        
        // 리프레시 토큰에도 닉네임 정보 추가
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return Jwts.builder()
                    .setSubject(userId)
                    .claim("nickname", user.getNickname()) // 닉네임 정보 추가
                    .setIssuedAt(now)
                    .setExpiration(new Date(now.getTime() + refreshExpiration))
                    .signWith(secretKey, SignatureAlgorithm.HS256)
                    .compact();
        } else {
            return Jwts.builder()
                    .setSubject(userId)
                    .setIssuedAt(now)
                    .setExpiration(new Date(now.getTime() + refreshExpiration))
                    .signWith(secretKey, SignatureAlgorithm.HS256)
                    .compact();
        }
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
    
    // 토큰에서 닉네임 추출
    public String getNicknameFromToken(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
        
        // 닉네임 필드 반환, 없으면 null 반환
        return claims.get("nickname", String.class);
    }

    // 토큰 유효성 검사
    public void validateTokenOrThrow(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(secretKey).build().parseClaimsJws(token);
        } catch (ExpiredJwtException e) {
            throw new UnauthorizedException("토큰이 만료되었습니다.");
        } catch (JwtException | IllegalArgumentException e) {
            throw new UnauthorizedException("유효하지 않은 토큰입니다.");
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
