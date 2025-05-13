package com.bookmarkservice.common.exception;

import org.springframework.http.HttpStatus;

public class DuplicateTagException extends BaseException {
    public DuplicateTagException(String message) {
        super(message);
    }

    @Override
    public HttpStatus getStatus() {
        return HttpStatus.CONFLICT;
    }
}
