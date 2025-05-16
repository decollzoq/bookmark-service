package com.bookmarkservice.test;

public class TestDto {
    private String id;
    private String message;

    public TestDto(TestDocument doc) {
        this.id = doc.getId().toHexString(); // ObjectId → 문자열로 변환
        this.message = doc.getMessage();
    }

    public String getId() {
        return id;
    }

    public String getMessage() {
        return message;
    }
}
