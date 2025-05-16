package com.bookmarkservice.test;

import org.bson.types.ObjectId;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/test")
public class TestController {
    private final TestRepository testRepository;

    public TestController(TestRepository testRepository) {
        this.testRepository = testRepository;
    }

    @PostMapping
    public TestDto saveTest(@RequestBody TestDocument document) {
        TestDocument saved = testRepository.save(document);
        return new TestDto(saved);
    }

    @GetMapping("/{id}")
    public TestDto getTest(@PathVariable String id) {
        TestDocument doc = testRepository.findById(new ObjectId(id)).orElse(null);
        return doc != null ? new TestDto(doc) : null;
    }
}
