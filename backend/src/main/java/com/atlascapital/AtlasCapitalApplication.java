package com.atlascapital;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class AtlasCapitalApplication {

    public static void main(String[] args) {
        SpringApplication.run(AtlasCapitalApplication.class, args);
    }
}
