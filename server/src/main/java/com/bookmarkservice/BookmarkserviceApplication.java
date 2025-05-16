package com.bookmarkservice;

import com.bookmarkservice.tag.controller.TagController;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;

@SpringBootApplication
public class BookmarkserviceApplication {
	public static void main(String[] args) {
		SpringApplication.run(BookmarkserviceApplication.class, args);
	}
//	@Bean
//	public CommandLineRunner runner(ApplicationContext ctx) {
//		return args -> {
//			System.out.println("==== REGISTERED CONTROLLERS ====");
//			String[] beans = ctx.getBeanNamesForAnnotation(RestController.class);
//			Arrays.stream(beans).forEach(System.out::println);
//		};
//	}
//	@Bean
//	public CommandLineRunner checkTagController(TagController tagController) {
//		return args -> {
//			System.out.println("✅ TagController 빈 등록 확인됨");
//		};
//	}

}
