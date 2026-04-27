package com.atlascapital.common.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "atlas.api")
public record AtlasApiProperties(Cors cors) {
    public AtlasApiProperties {
        if (cors == null) {
            cors = new Cors(List.of("http://localhost:4200"));
        }
    }

    public record Cors(List<String> allowedOrigins) {
        public Cors {
            if (allowedOrigins == null || allowedOrigins.isEmpty()) {
                allowedOrigins = List.of("http://localhost:4200");
            }
        }
    }
}
