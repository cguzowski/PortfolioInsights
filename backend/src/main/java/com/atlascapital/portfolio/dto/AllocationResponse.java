package com.atlascapital.portfolio.dto;

import java.math.BigDecimal;

public record AllocationResponse(
        String assetClass,
        BigDecimal percentage
) {
}
