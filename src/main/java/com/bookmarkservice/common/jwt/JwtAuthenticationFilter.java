package com.bookmarkservice.common.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String token = jwtTokenProvider.resolveToken(request);

        if (StringUtils.hasText(token) && jwtTokenProvider.isValid(token)) {
            String userId = jwtTokenProvider.getUserIdFromToken(token);

            // 인증 객체 생성
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(userId, null, null); // 권한은 지금 null

            authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            // 시큐리티 컨텍스트에 저장
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        return path.startsWith("/auth/reissue")
                || path.startsWith("/auth/login")
                || path.startsWith("/email/send-code")
                || path.startsWith("/email/verify-code")
                || path.startsWith("/users/register"); // 회원가입 경로도 여기에
    }

}