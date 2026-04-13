package com.atlascapital.portfolio.dto;

import java.math.BigDecimal;

public record PortfolioHoldingResponse(
        Long id,
        String ticker,
        String name,
        String assetClass,
        BigDecimal quantity,
        BigDecimal averageCost,
        BigDecimal currentPrice,
        BigDecimal changePercent,
        BigDecimal marketValue,
        BigDecimal weight
) {
}
