package com.example.findAnswer.mentorbridge.config;

import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.servers.Server;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Find Answer Swagger Documentation")
                        .description("Find Answer Swagger Documentation")
                        .version("1.0")
                )                .servers(List.of(
                        new Server()
                                .url("https://api-findanswer.duckdns.org")
                                .description("운영"),
                        new Server()
                                .url("http://localhost:8080")
                                .description("로컬")
                ));
    }

    @Bean
    public GroupedOpenApi customGroupedOpenAPI() {
        String[] paths = {"/api/**", "/", "/health"};
        String[] packagesToScan = {"com.example.findAnswer"};

        return GroupedOpenApi.builder()
                .group("findAnswer")
                .pathsToMatch(paths)
                .packagesToScan(packagesToScan)
                .build();

    }
}
