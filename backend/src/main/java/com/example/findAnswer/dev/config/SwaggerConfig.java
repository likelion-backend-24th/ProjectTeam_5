package com.example.findAnswer.dev.config;

import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.OpenAPI;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

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
                );
    }

    @Bean
    public GroupedOpenApi customGroupedOpenAPI() {
        String[] paths = {"/api/**"};
        String[] packagesToScan = {"com.example.findAnswer"};

        return GroupedOpenApi.builder()
                .group("findAnswer")
                .pathsToMatch(paths)
                .packagesToScan(packagesToScan)
                .build();

    }
}
