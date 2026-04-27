package com.atlascapital.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {
    private final AtlasApiProperties apiProperties;

    public CorsConfig(AtlasApiProperties apiProperties) {
        this.apiProperties = apiProperties;
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        String[] allowedOrigins = apiProperties.cors().allowedOrigins().toArray(String[]::new);

        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(allowedOrigins)
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}
