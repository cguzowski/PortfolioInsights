package com.atlascapital.portfolio.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record PortfolioSummaryResponse(
        Long portfolioId,
        Long userId,
        String userName,
        String portfolioName,
        String baseCurrency,
        BigDecimal totalValue,
        BigDecimal totalCost,
        BigDecimal dailyPnl,
        BigDecimal dailyPnlPercent,
        BigDecimal totalPnl,
        BigDecimal totalPnlPercent,
        BigDecimal cashBalance,
        String riskProfile,
        OffsetDateTime lastUpdated,
        List<AllocationResponse> allocations,
        List<PortfolioHoldingResponse> holdings
) {
}
