package com.example.findAnswer.dev.controller;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Health Check API", description = "Health Check API 입니다.")
public class HealthController {

    @GetMapping("/")
    public String home() {
        return "FindAnswer backend is running";
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}