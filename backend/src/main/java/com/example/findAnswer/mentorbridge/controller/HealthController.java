package com.example.findAnswer.mentorbridge.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Health Check API", description = "Health Check API 입니다.")
public class HealthController {

    @Tag(name = "Health Check API")
    @Operation(summary = "Health Landing", description = "Health Landing API")
    @GetMapping("/")
    public String home() {
        return "FindAnswer backend is running";
    }

    @Tag(name = "Health Check API")
    @Operation(summary = "Health Check", description = "Health Check API")
    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}