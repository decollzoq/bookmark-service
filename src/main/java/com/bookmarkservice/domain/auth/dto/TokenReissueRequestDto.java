package com.bookmarkservice.domain.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TokenReissueRequestDto {
    private String refreshToken;
}
