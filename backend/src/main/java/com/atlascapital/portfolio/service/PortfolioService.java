package com.atlascapital.portfolio.service;

import com.atlascapital.portfolio.dto.AllocationResponse;
import com.atlascapital.portfolio.dto.PortfolioHoldingRequest;
import com.atlascapital.portfolio.dto.PortfolioHoldingResponse;
import com.atlascapital.portfolio.dto.PortfolioSummaryResponse;
import com.atlascapital.portfolio.exception.HoldingNotFoundException;
import com.atlascapital.portfolio.exception.PortfolioNotFoundException;
import com.atlascapital.portfolio.model.PortfolioEntity;
import com.atlascapital.portfolio.model.PortfolioHoldingEntity;
import com.atlascapital.portfolio.repository.PortfolioHoldingRepository;
import com.atlascapital.portfolio.repository.PortfolioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class PortfolioService {

    private static final Long PORTFOLIO_ID = 1001L;

    private final PortfolioRepository portfolioRepository;
    private final PortfolioHoldingRepository portfolioHoldingRepository;

    public PortfolioService(PortfolioRepository portfolioRepository,
                            PortfolioHoldingRepository portfolioHoldingRepository) {
        this.portfolioRepository = portfolioRepository;
        this.portfolioHoldingRepository = portfolioHoldingRepository;
    }

    public PortfolioSummaryResponse getPortfolio() {
        PortfolioEntity portfolio = getManagedPortfolio();
        BigDecimal holdingsValue = calculateHoldingsValue(portfolio.getHoldings());
        BigDecimal totalValue = holdingsValue.add(portfolio.getCashBalance());
        BigDecimal totalCost = calculateTotalCost(portfolio.getHoldings());
        BigDecimal totalPnl = holdingsValue.subtract(totalCost);
        BigDecimal dailyPnl = calculateDailyPnl(portfolio.getHoldings());

        List<PortfolioHoldingResponse> holdingResponses = portfolio.getHoldings().stream()
                .map(holding -> toResponse(holding, holdingsValue))
                .sorted(Comparator.comparing(PortfolioHoldingResponse::marketValue).reversed())
                .toList();

        return new PortfolioSummaryResponse(
                portfolio.getId(),
                portfolio.getUserId(),
                "Sophia Bennett",
                portfolio.getPortfolioName(),
                portfolio.getBaseCurrency(),
                scale(totalValue),
                scale(totalCost),
                scale(dailyPnl),
                percentage(dailyPnl, totalValue.subtract(dailyPnl)),
                scale(totalPnl),
                percentage(totalPnl, totalCost),
                scale(portfolio.getCashBalance()),
                portfolio.getRiskProfile(),
                portfolio.getUpdatedAt() != null ? portfolio.getUpdatedAt() : OffsetDateTime.now(),
                buildAllocations(holdingResponses, holdingsValue),
                holdingResponses
        );
    }

    @Transactional
    public PortfolioHoldingResponse createHolding(PortfolioHoldingRequest request) {
        PortfolioEntity portfolio = getManagedPortfolio();
        PortfolioHoldingEntity holding = new PortfolioHoldingEntity();
        applyRequest(holding, request);
        portfolio.addHolding(holding);
        PortfolioHoldingEntity persisted = portfolioHoldingRepository.saveAndFlush(holding);
        BigDecimal holdingsValue = calculateHoldingsValue(portfolio.getHoldings());
        return toResponse(persisted, holdingsValue);
    }

    @Transactional
    public PortfolioHoldingResponse updateHolding(Long id, PortfolioHoldingRequest request) {
        PortfolioEntity portfolio = getManagedPortfolio();
        PortfolioHoldingEntity holding = findHolding(portfolio, id);
        applyRequest(holding, request);
        PortfolioHoldingEntity updated = portfolioHoldingRepository.saveAndFlush(holding);
        BigDecimal holdingsValue = calculateHoldingsValue(portfolio.getHoldings());
        return toResponse(updated, holdingsValue);
    }

    @Transactional
    public void deleteHolding(Long id) {
        PortfolioEntity portfolio = getManagedPortfolio();
        PortfolioHoldingEntity holding = findHolding(portfolio, id);
        portfolio.removeHolding(holding);
        portfolioRepository.saveAndFlush(portfolio);
    }

    private List<AllocationResponse> buildAllocations(List<PortfolioHoldingResponse> holdingResponses,
                                                      BigDecimal holdingsValue) {
        Map<String, BigDecimal> byAssetClass = new LinkedHashMap<>();
        for (PortfolioHoldingResponse holding : holdingResponses) {
            byAssetClass.merge(holding.assetClass(), holding.marketValue(), BigDecimal::add);
        }

        return byAssetClass.entrySet().stream()
                .map(entry -> new AllocationResponse(entry.getKey(), percentage(entry.getValue(), holdingsValue)))
                .toList();
    }

    private PortfolioHoldingResponse toResponse(PortfolioHoldingEntity holding, BigDecimal holdingsValue) {
        BigDecimal marketValue = holding.getCurrentPrice().multiply(holding.getQuantity());
        BigDecimal weight = holdingsValue.signum() == 0
                ? BigDecimal.ZERO
                : marketValue.divide(holdingsValue, 6, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

        return new PortfolioHoldingResponse(
                holding.getId(),
                holding.getTicker(),
                holding.getSecurityName(),
                holding.getAssetClass(),
                scale(holding.getQuantity()),
                scale(holding.getAverageCost()),
                scale(holding.getCurrentPrice()),
                scale(holding.getChangePercent()),
                scale(marketValue),
                scale(weight)
        );
    }

    private BigDecimal calculateHoldingsValue(List<PortfolioHoldingEntity> holdings) {
        return scale(holdings.stream()
                .map(holding -> holding.getCurrentPrice().multiply(holding.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    private BigDecimal calculateTotalCost(List<PortfolioHoldingEntity> holdings) {
        return scale(holdings.stream()
                .map(holding -> holding.getAverageCost().multiply(holding.getQuantity()))
                .reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    private BigDecimal calculateDailyPnl(List<PortfolioHoldingEntity> holdings) {
        return scale(holdings.stream()
                .map(holding -> holding.getCurrentPrice()
                        .multiply(holding.getQuantity())
                        .multiply(holding.getChangePercent())
                        .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP))
                .reduce(BigDecimal.ZERO, BigDecimal::add));
    }

    private BigDecimal percentage(BigDecimal numerator, BigDecimal denominator) {
        if (denominator == null || denominator.signum() == 0) {
            return BigDecimal.ZERO;
        }

        return scale(numerator.divide(denominator, 6, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)));
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    private PortfolioEntity getManagedPortfolio() {
        return portfolioRepository.findById(PORTFOLIO_ID)
                .orElseThrow(() -> new PortfolioNotFoundException(PORTFOLIO_ID));
    }

    private PortfolioHoldingEntity findHolding(PortfolioEntity portfolio, Long id) {
        return portfolio.getHoldings().stream()
                .filter(holding -> holding.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new HoldingNotFoundException(id));
    }

    private void applyRequest(PortfolioHoldingEntity holding, PortfolioHoldingRequest request) {
        holding.setTicker(request.ticker().trim().toUpperCase());
        holding.setSecurityName(request.name().trim());
        holding.setAssetClass(request.assetClass().trim());
        holding.setQuantity(request.quantity());
        holding.setAverageCost(request.averageCost());
        holding.setCurrentPrice(request.currentPrice());
        holding.setChangePercent(request.changePercent());
    }
}
