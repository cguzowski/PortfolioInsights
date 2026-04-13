package com.atlascapital.portfolio.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PortfolioHoldingRequest(
        @NotBlank
        @Size(max = 10)
        String ticker,
        @NotBlank
        @Size(max = 80)
        String name,
        @NotBlank
        @Size(max = 30)
        String assetClass,
        @NotNull
        @DecimalMin(value = "0.0001")
        BigDecimal quantity,
        @NotNull
        @DecimalMin("0.0")
        BigDecimal averageCost,
        @NotNull
        @DecimalMin("0.0")
        BigDecimal currentPrice,
        @NotNull
        @DecimalMin("-100.0")
        @DecimalMax("100.0")
        BigDecimal changePercent
) {
}
