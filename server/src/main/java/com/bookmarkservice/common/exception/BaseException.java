package com.bookmarkservice.common.exception;

import org.springframework.http.HttpStatus;

public abstract class BaseException extends RuntimeException {
    public abstract HttpStatus getStatus();

    public BaseException(String message) {
        super(message);
    }
}