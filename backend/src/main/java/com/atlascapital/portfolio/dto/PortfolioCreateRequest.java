package com.atlascapital.portfolio.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record PortfolioCreateRequest(
        @NotNull
        Long userId,
        @NotBlank
        @Size(max = 120)
        String portfolioName,
        @NotBlank
        @Size(min = 3, max = 3)
        String baseCurrency,
        @NotBlank
        @Size(max = 30)
        String riskProfile,
        @NotNull
        @DecimalMin("0.0")
        BigDecimal cashBalance,
        @NotEmpty
        List<@Valid PortfolioHoldingRequest> holdings
) {
}
