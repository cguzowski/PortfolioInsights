package com.atlascapital.portfolio;

import com.atlascapital.portfolio.service.PortfolioService;
import com.atlascapital.portfolio.dto.PortfolioHoldingRequest;
import com.atlascapital.portfolio.dto.PortfolioHoldingResponse;
import com.atlascapital.portfolio.dto.PortfolioSummaryResponse;
import com.atlascapital.portfolio.repository.PortfolioHoldingRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PortfolioServiceIntegrationTests {

    @Autowired
    private PortfolioService portfolioService;

    @Autowired
    private PortfolioHoldingRepository portfolioHoldingRepository;

    @Test
    void shouldLoadSeededPortfolioFromDatabase() {
        PortfolioSummaryResponse portfolio = portfolioService.getPortfolio(501L, null);

        assertThat(portfolio.portfolioId()).isEqualTo(1001L);
        assertThat(portfolio.userId()).isEqualTo(501L);
        assertThat(portfolio.userName()).isEqualTo("Sophia Bennett");
        assertThat(portfolio.holdings()).hasSize(5);
        assertThat(portfolio.totalValue()).isPositive();
    }

    @Test
    void shouldPersistHoldingCrudOperations() {
        PortfolioHoldingRequest createRequest = new PortfolioHoldingRequest(
                "TSLA",
                "Tesla Inc.",
                "Equity",
                BigDecimal.valueOf(18),
                BigDecimal.valueOf(165.25),
                BigDecimal.valueOf(172.40),
                BigDecimal.valueOf(1.85)
        );

        PortfolioHoldingResponse created = portfolioService.createHolding(501L, 1001L, createRequest);

        assertThat(created.id()).isNotNull();
        assertThat(portfolioHoldingRepository.findById(created.id())).isPresent();

        PortfolioHoldingRequest updateRequest = new PortfolioHoldingRequest(
                "TSLA",
                "Tesla Motors",
                "Equity",
                BigDecimal.valueOf(20),
                BigDecimal.valueOf(165.25),
                BigDecimal.valueOf(174.10),
                BigDecimal.valueOf(2.10)
        );

        PortfolioHoldingResponse updated = portfolioService.updateHolding(501L, 1001L, created.id(), updateRequest);

        assertThat(updated.name()).isEqualTo("Tesla Motors");
        assertThat(updated.quantity()).isEqualByComparingTo("20.00");

        portfolioService.deleteHolding(501L, 1001L, created.id());

        assertThat(portfolioHoldingRepository.findById(created.id())).isEmpty();
    }
}
