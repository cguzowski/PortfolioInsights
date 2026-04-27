package com.atlascapital.portfolio.service;

import com.atlascapital.common.exception.HoldingNotFoundException;
import com.atlascapital.common.exception.PortfolioNotFoundException;
import com.atlascapital.portfolio.dto.AllocationResponse;
import com.atlascapital.portfolio.dto.PortfolioCreateRequest;
import com.atlascapital.portfolio.dto.PortfolioHoldingRequest;
import com.atlascapital.portfolio.dto.PortfolioHoldingResponse;
import com.atlascapital.portfolio.dto.PortfolioSummaryResponse;
import com.atlascapital.portfolio.entity.AppUserEntity;
import com.atlascapital.portfolio.entity.PortfolioEntity;
import com.atlascapital.portfolio.entity.PortfolioHoldingEntity;
import com.atlascapital.portfolio.repository.PortfolioHoldingRepository;
import com.atlascapital.portfolio.repository.PortfolioRepository;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

@Service
@Transactional(readOnly = true)
public class PortfolioService {
    private final PortfolioRepository portfolioRepository;
    private final PortfolioHoldingRepository portfolioHoldingRepository;
    private final EntityManager entityManager;

    public PortfolioService(PortfolioRepository portfolioRepository,
                            PortfolioHoldingRepository portfolioHoldingRepository,
                            EntityManager entityManager) {
        this.portfolioRepository = portfolioRepository;
        this.portfolioHoldingRepository = portfolioHoldingRepository;
        this.entityManager = entityManager;
    }

    public PortfolioSummaryResponse getPortfolio(Long userId, Long portfolioId) {
        PortfolioEntity portfolio = getManagedPortfolio(userId, portfolioId);
        return toSummary(portfolio);
    }

    public List<PortfolioSummaryResponse> getPortfolios(Long userId) {
        List<PortfolioEntity> portfolios = userId != null
                ? portfolioRepository.findByUser_IdOrderByIdAsc(userId)
                : portfolioRepository.findAllByOrderByIdAsc();

        return portfolios.stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional
    public PortfolioSummaryResponse createPortfolio(PortfolioCreateRequest request) {
        AppUserEntity user = entityManager.find(AppUserEntity.class, request.userId());
        if (user == null) {
            throw new PortfolioNotFoundException("User with id " + request.userId() + " was not found.");
        }

        PortfolioEntity portfolio = new PortfolioEntity();
        portfolio.setUser(user);
        applyPortfolioRequest(portfolio, request);

        PortfolioEntity persisted = portfolioRepository.saveAndFlush(portfolio);
        return toSummary(persisted);
    }

    @Transactional
    public PortfolioSummaryResponse updatePortfolio(Long portfolioId, PortfolioCreateRequest request) {
        PortfolioEntity portfolio = getManagedPortfolio(request.userId(), portfolioId);
        applyPortfolioRequest(portfolio, request);

        PortfolioEntity updated = portfolioRepository.saveAndFlush(portfolio);
        return toSummary(updated);
    }

    @Transactional
    public void deletePortfolio(Long userId, Long portfolioId) {
        PortfolioEntity portfolio = getManagedPortfolio(userId, portfolioId);
        portfolioRepository.delete(portfolio);
        portfolioRepository.flush();
    }

    private void applyPortfolioRequest(PortfolioEntity portfolio, PortfolioCreateRequest request) {
        portfolio.setPortfolioName(request.portfolioName().trim());
        portfolio.setBaseCurrency(request.baseCurrency().trim().toUpperCase());
        portfolio.setRiskProfile(request.riskProfile().trim());
        portfolio.setCashBalance(scale(request.cashBalance()));
        portfolio.clearHoldings();

        for (PortfolioHoldingRequest holdingRequest : request.holdings()) {
            PortfolioHoldingEntity holding = new PortfolioHoldingEntity();
            applyRequest(holding, holdingRequest);
            portfolio.addHolding(holding);
        }
    }

    private PortfolioSummaryResponse toSummary(PortfolioEntity portfolio) {
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
                portfolio.getUser().getFullName(),
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
    public PortfolioHoldingResponse createHolding(Long userId, Long portfolioId, PortfolioHoldingRequest request) {
        PortfolioEntity portfolio = getManagedPortfolio(userId, portfolioId);
        PortfolioHoldingEntity holding = new PortfolioHoldingEntity();
        applyRequest(holding, request);
        portfolio.addHolding(holding);
        PortfolioHoldingEntity persisted = portfolioHoldingRepository.saveAndFlush(holding);
        BigDecimal holdingsValue = calculateHoldingsValue(portfolio.getHoldings());
        return toResponse(persisted, holdingsValue);
    }

    @Transactional
    public PortfolioHoldingResponse updateHolding(Long userId,
                                                  Long portfolioId,
                                                  Long id,
                                                  PortfolioHoldingRequest request) {
        PortfolioHoldingEntity holding = getManagedHolding(userId, portfolioId, id);
        applyRequest(holding, request);
        PortfolioHoldingEntity updated = portfolioHoldingRepository.saveAndFlush(holding);
        BigDecimal holdingsValue = calculateHoldingsValue(updated.getPortfolio().getHoldings());
        return toResponse(updated, holdingsValue);
    }

    @Transactional
    public void deleteHolding(Long userId, Long portfolioId, Long id) {
        PortfolioHoldingEntity holding = getManagedHolding(userId, portfolioId, id);
        PortfolioEntity portfolio = holding.getPortfolio();
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
        return sumHoldings(holdings, holding -> holding.getCurrentPrice().multiply(holding.getQuantity()));
    }

    private BigDecimal calculateTotalCost(List<PortfolioHoldingEntity> holdings) {
        return sumHoldings(holdings, holding -> holding.getAverageCost().multiply(holding.getQuantity()));
    }

    private BigDecimal calculateDailyPnl(List<PortfolioHoldingEntity> holdings) {
        return sumHoldings(holdings, holding -> holding.getCurrentPrice()
                .multiply(holding.getQuantity())
                .multiply(holding.getChangePercent())
                .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
    }

    private BigDecimal sumHoldings(List<PortfolioHoldingEntity> holdings,
                                   Function<PortfolioHoldingEntity, BigDecimal> value) {
        return scale(holdings.stream()
                .map(value)
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

    private PortfolioEntity getManagedPortfolio(Long userId, Long portfolioId) {
        if (portfolioId != null && userId != null) {
            return portfolioRepository.findByIdAndUser_Id(portfolioId, userId)
                    .orElseThrow(() -> new PortfolioNotFoundException(
                            "Portfolio with id " + portfolioId + " was not found for user " + userId + "."
                    ));
        }

        if (portfolioId != null) {
            return portfolioRepository.findById(portfolioId)
                    .orElseThrow(() -> new PortfolioNotFoundException(portfolioId));
        }

        if (userId != null) {
            return portfolioRepository.findFirstByUser_IdOrderByIdAsc(userId)
                    .orElseThrow(() -> new PortfolioNotFoundException(
                            "No portfolio was found for user " + userId + "."
                    ));
        }

        return portfolioRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new PortfolioNotFoundException("No portfolios are available."));
    }

    private PortfolioHoldingEntity getManagedHolding(Long userId, Long portfolioId, Long id) {
        if (portfolioId != null && userId != null) {
            return portfolioHoldingRepository.findByIdAndPortfolio_IdAndPortfolio_User_Id(id, portfolioId, userId)
                    .orElseThrow(() -> new HoldingNotFoundException(id));
        }

        if (portfolioId != null) {
            return portfolioHoldingRepository.findByIdAndPortfolio_Id(id, portfolioId)
                    .orElseThrow(() -> new HoldingNotFoundException(id));
        }

        return portfolioHoldingRepository.findById(id)
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
