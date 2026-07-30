package com.example.findAnswer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class FindAnswerApplication {

	public static void main(String[] args) {
		SpringApplication.run(FindAnswerApplication.class, args);
	}

}
