package com.bookmarkservice.test;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "test_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TestDocument {
    @Id
    private ObjectId id;
    private String message;
}
